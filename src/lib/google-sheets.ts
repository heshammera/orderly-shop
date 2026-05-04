import { google } from 'googleapis';

async function getGoogleAuthToken(serviceAccountJson: string): Promise<string> {
    try {
        if (!serviceAccountJson) {
            throw new Error('Service Account JSON is empty');
        }

        const credentials = JSON.parse(serviceAccountJson);
        
        // Aggressive normalization and reconstruction for OpenSSL 3.0
        let rawKey = credentials.private_key
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\\n/g, '')
            .replace(/\s/g, ''); // Remove ALL whitespace, newlines, and escapes

        // Reconstruct with proper 64-character lines
        const lines = rawKey.match(/.{1,64}/g) || [];
        const formattedKey = [
            '-----BEGIN PRIVATE KEY-----',
            ...lines,
            '-----END PRIVATE KEY-----'
        ].join('\n');

        console.log('[Google Sheets] RECONSTRUCTED KEY START:', formattedKey.substring(0, 100));
        console.log('[Google Sheets] RECONSTRUCTED KEY END:', formattedKey.substring(formattedKey.length - 50));

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: formattedKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const token = await auth.authorize();
        
        if (!token.access_token) {
            throw new Error('Failed to get access token from Google');
        }

        return token.access_token;
    } catch (error: any) {
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

export async function checkSheetAccess(serviceAccount: string, sheetId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const token = await getGoogleAuthToken(serviceAccount);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Sheets API Error:', response.status, errorText);
            
            let errorMessage = `Google API Error (${response.status})`;
            try {
                const errObj = JSON.parse(errorText);
                if (errObj.error && errObj.error.message) {
                    errorMessage = errObj.error.message;
                }
            } catch (e) {}

            return { success: false, message: errorMessage };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error checking sheet access:', error);
        return { success: false, message: error.message || 'Unknown error' };
    }
}

export async function getSheetValues(
    serviceAccount: string,
    sheetId: string,
    range: string
) {
    try {
        const token = await getGoogleAuthToken(serviceAccount);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Error getting values from Google Sheet:', error);
        return null;
    }
}
