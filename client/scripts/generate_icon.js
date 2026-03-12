const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const outPng = path.join(__dirname, 'icon-512.png');
    const outIco = path.join(__dirname, '..', 'public', 'favicon.ico');

    // create 512x512 PNG with a simple background and 'C' letter
    const image = new Jimp(512, 512, '#6B5BFF');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_256_WHITE);
    image.print(font, 0, 0, {
      text: 'C',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, 512, 512);

    await image.writeAsync(outPng);

    const icoBuffer = await pngToIco(outPng);
    fs.writeFileSync(outIco, icoBuffer);
    console.log('Generated icon at', outIco);
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exit(1);
  }
})();
