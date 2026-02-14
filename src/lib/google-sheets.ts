import crypto from 'crypto';

interface ServiceAccountCredentials {
    client_email: string;
    private_key: string;
    project_id: string;
}

interface GoogleToken {
    access_token: string;
    expires_in: number;
    token_type: string;
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getGoogleAuthToken(serviceAccountJson: string): Promise<string> {
    try {
        const credentials = JSON.parse(serviceAccountJson) as ServiceAccountCredentials;

        if (!credentials.client_email || !credentials.private_key) {
            throw new Error('Invalid Service Account JSON: Missing client_email or private_key');
        }

        const now = Math.floor(Date.now() / 1000);
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const claimSet = {
            iss: credentials.client_email,
            scope: SCOPES.join(' '),
            aud: GOOGLE_TOKEN_URL,
            exp: now + 3600,
            iat: now
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(`${encodedHeader}.${encodedClaimSet}`);
        const signature = signer.sign(credentials.private_key, 'base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const jwt = `${encodedHeader}.${encodedClaimSet}.${signature}`;

        const response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get Google Token: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const tokenData = await response.json() as GoogleToken;
        return tokenData.access_token;
    } catch (error) {
        console.error('Error getting Google Auth Token:', error);
        throw error;
    }
}

export async function appendRow(
    serviceAccount: string,
    sheetId: string,
    tabName: string,
    values: any[][]
) {
    try {
        const token = await getGoogleAuthToken(serviceAccount);

        // Range should be just the tab name to append to the end of the sheet
        // Use 'A:A' if you want to be specific, but 'TabName' works for append
        // Encoding tab name for URL safety
        const range = `${tabName}!A1`;

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: values
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error('Error appending row to Google Sheet:', error);
        throw error;
    }
}

export async function checkSheetAccess(serviceAccount: string, sheetId: string): Promise<boolean> {
    try {
        const token = await getGoogleAuthToken(serviceAccount);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If 403 or 404, it means no access or not found
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking sheet access:', error);
        return false;
    }
}
