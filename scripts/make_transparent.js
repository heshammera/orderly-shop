const Jimp = require('jimp');

async function makeTransparent() {
    try {
        const image = await Jimp.read('public/logo.png');

        // We want to turn white (or near white) into transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            // The colors are stored in the image.bitmap.data buffer
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // If the pixel is white or very close to white, make it fully transparent
            if (red > 240 && green > 240 && blue > 240) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0
            }
        });

        await image.writeAsync('src/app/icon.png');
        // Also update public/logo.png itself to be transparent so the Header.tsx reads it correctly
        await image.writeAsync('public/logo.png');

        console.log('Successfully made the logo transparent!');
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

makeTransparent();
