const Jimp      = require('jimp');

module.exports.bypass = function(path){
    var captcha = path + 'captcha.png';
    Jimp.read(captcha).then(image => {
        console.log("LOG : Scanning and editing captcha images..");
        const targetColor = {r: 176, g: 175, b: 175, a: 1};
        const replaceColor = {r: 0, g: 0, b: 0, a: 0};
        const colorDistance = (c1, c2) => Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2) + Math.pow(c1.a - c2.a, 2));  // Distance between two colors
        const threshold = 32;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const thisColor = {
                r: image.bitmap.data[idx + 0],
                g: image.bitmap.data[idx + 1],
                b: image.bitmap.data[idx + 2],
                a: image.bitmap.data[idx + 3]
            };
            
            if(colorDistance(targetColor, thisColor) <= threshold) {
                image.bitmap.data[idx + 0] = replaceColor.r;
                image.bitmap.data[idx + 1] = replaceColor.g;
                image.bitmap.data[idx + 2] = replaceColor.b;
                image.bitmap.data[idx + 3] = replaceColor.a;
            }
        });
        image.color([{apply: 'desaturate', params: [90]},{ apply: 'brighten', params: [45] }]);
        image.contrast(1);
        image.greyscale();
        image.quality(100);
        image.write(captcha);
    })
    .catch(err => {
        console.error(err);
    });
}