require('dotenv').config({ path: `.env/.env.${process.env.NODE_ENV}` })

const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminOpting = require('imagemin-optipng')
const imageminWebp = require('imagemin-webp')

const path = require("path")
const fse = require('fs-extra') 
const Image = require("@11ty/eleventy-img")
const transformDomPlugin = require('eleventy-plugin-transformdom')


module.exports = function (eleventyConfig) {


    /**
     * HTMLファイルの書き出し時にDOMを操作する
     * JavaScriptのDOM操作と同様の書き方ができる。
     */
    eleventyConfig.addPlugin(transformDomPlugin, [
        {
            selector: 'a[target="_blank"]',
            transform: ({ elements }) => {
                // target="_blank"のリンクにはrel="noopener noreferrer"を付与する
                elements.forEach((a) => {
                    a.setAttribute('rel', 'noopener noreferrer');
                });
            },
        },
        {
            selector: 'img',
            transform: ({ elements , document }) => {
                elements.forEach((img) => {
                    // loading lazyを自動で付与する
                    img.setAttribute('loading', 'lazy');

                    let src = img.getAttribute('src');
                    if(src.startsWith('../')){
                        // srcの画像を相対パスで指定した場合は階層を変更しdistを追加する。
                        src = src.replace(/^\.\.\//,'')
                        src = src.replace("img/",`${process.env.DEST_DIR}/img/`)
                        img.setAttribute('src',src);
                    }else if(src.startsWith('/src/img/')){
                        // srcの画像をフルパスで指定した場合はdistに変更する。
                        src = src.replace("/src/",`/${process.env.DEST_DIR}/`)
                        img.setAttribute('src',src);
                    }
                    // jpgまたはpngファイルかつ親要素がpictureでない時webp用のタグに変更します。
                    if(src.toLowerCase().match(/\.(jpe?g|png)$/i)){
                        if(img.parentElement.nodeName.toLowerCase() !== 'picture' && !img.classList.contains('-no-trans')){
                            const srcset = src.replace(/\.(jpe?g|png)$/i,'.webp')
                            const picture = document.createElement("picture");
                            const source = document.createElement("source");
                            source.setAttribute('type','image/webp')
                            source.setAttribute('srcset',srcset)
                            img.before(picture)
                            picture.append(source)
                            picture.append(img)
                        }
                    }
                });
            },
        },
        
    ]);

    /**
     *  コピーしたいリソースファイルはここで指定する 
     * */
    eleventyConfig.addPassthroughCopy({"src/fonts": `${process.env.DEST_DIR}/fonts`});
    eleventyConfig.addPassthroughCopy({"src/ico": `${process.env.DEST_DIR}/ico`});

    if(process.env.NODE_ENV !== 'production'){
        // 画像通常コピー
        eleventyConfig.addPassthroughCopy({"src/img": `${process.env.DEST_DIR}/img`});
        // webp生成
        CopyFilesRecursively('src/img',`${process.env.OUTPUT_DIR}/${process.env.DEST_DIR}/img`)
        eleventyConfig.addPassthroughCopy({"src/js/app.js": `${process.env.DEST_DIR}/js/app.js`});
        eleventyConfig.addPassthroughCopy({"src/scss/__tests__/_test.scss": `${process.env.DEST_DIR}/scss/_test.scss`});

    }else{
        eleventyConfig.ignores.add("src/template/__tests__")
        // オリジナル画像を圧縮してコピー / jpg pngの場合は webpを生成
        CopyFilesRecursively('src/img',`${process.env.OUTPUT_DIR}/${process.env.DEST_DIR}/img`)

    }
    
    /**
     * レスポンシブイメージとwebpのコード生成のショートコード
     * @usage { img src="/path/to/img" alt="Image alt" }
     */
    // eleventyConfig.addNunjucksAsyncShortcode("img", async (src, alt) => {
    //     // if (!alt) {
    //     //     throw new Error(`Missing \`alt\` on myImage from: ${src}`);
    //     // }
    //     if(src.startsWith('/src')){
    //         src = src.replace(/^\/src\/img/,'')
    //     }else{
    //         src = src.replace(/^[\.\/]*\/img/,'') 
    //     }
    //     const srcPath =  path.resolve('src/img' + src)
    //     const distPath = path.dirname(srcPath.replace(/src\/img/,`${process.env.OUTPUT_DIR}/${process.env.DEST_DIR}/img`))
    //     const urlPath = `/${process.env.DEST_DIR}/img` + path.dirname(src)
        
    //     let stats = await Image(srcPath, {
    //         widths: [640, 800, 1024, 1500, 2000],
    //         formats: ["jpeg","webp"],
    //         urlPath: urlPath,
    //         outputDir: distPath + '/',
    //         filenameFormat: function (id, src, width, format, options) {
    //             let ext = format
    //             if(format === "jpeg"){
    //                 ext = "jpg"
    //             }
    //             const extension = path.extname(src);
    //             const name = path.basename(src, extension)
    //             return `${name}-${width}w.${ext}`;
    //         },
    //         sharpJpegOptions: {quality: 90}
    //     });

    //     let lowestSrc = stats["jpeg"][0];
    
    //     const srcset = Object.keys(stats).reduce(
    //         (acc, format) => ({
    //             ...acc,
    //             [format]: stats[format].reduce(
    //                 (_acc, curr) => `${_acc} ${curr.srcset},`,
    //                 ""
    //             ),
    //         }),
    //         {}
    //     );
    
    //     const source = `<source type="image/webp" srcset="${srcset["webp"]}" >`;
    
    //     const img = `<img loading="lazy" alt="${alt}" src="${lowestSrc.url}" srcset="${srcset["jpeg"]}" width="${lowestSrc.width}" height="${lowestSrc.height}">`;
    
    //     return `<picture>${source}${img}</picture>`;
    // });

    return {
        templateFormats: ['njk', 'html'],
        htmlTemplateEngine: 'njk',
        dir: {
            input: 'src/template',
            output: `${process.env.OUTPUT_DIR}`,
            includes: "_includes",
            layouts: "_layouts",
            data: "_data"
        }
    }
}


/**
* 再帰的にパス配下のファイル・フォルダ一覧を取得
 * @param {string} targetpath 探索する対象のパス
 * @param {number} depth 探索する深さ。オプション。デフォルトは指定なし。
 * @returns 取得したファイル、ディレクトリの｛path:絶対パス, isDir:ディレクトリか} を配列で返す
 */
const GetFilelistRecursively = ((targetpath, depth = -1) => {
    let result = [];
    var dirs = fse.readdirSync(targetpath);
    dirs.forEach(file => {
        let filepath = targetpath + "/" + file;
        let isDir = fse.lstatSync(filepath).isDirectory();
        result.push({path:filepath, isDir:isDir });
        if ( isDir ) {
            if ( depth == 0 ) return result;
            result = result.concat( GetFilelistRecursively(filepath, depth - 1));
        }
    });
    return result;
});

/**
 * 指定したパス配下のフォルダ、ファイルを同じ構造で再帰的にコピーします。
 * コピー先のディレクトリが存在しない場合、フォルダが作成され、その中にコピーします。
 * @param {string} srcpath コピー元のパス
 * @param {string} destpath コピー先のパス
 */
const CopyFilesRecursively = ((srcpath, destpath) => {
    if ( !fse.existsSync(destpath) ) {
        fse.mkdirSync(destpath,{ recursive: true } );
    }
    let targetList = GetFilelistRecursively( srcpath );
    targetList.forEach( node => {
        const newpath = destpath + node.path.substring(srcpath.length)
        const newDir = path.dirname(newpath)
        if ( node.isDir) {
            if ( !fse.existsSync(destpath) ) fse.mkdirSync(newpath);
        } else {
            const ext = path.extname(node.path).toLocaleLowerCase()
            const imageExt = [ '.png','.jpg','.jpeg','.gif','.tiff','.wepb','.svg']

            if(imageExt.includes(ext)){
                
                if(process.env.NODE_ENV === 'production'){
                    imagemin([node.path], {
                        destination:  newDir,
                        plugins: [
                            imageminMozjpeg({ quality: 80 }),
                            imageminPngquant({
                                quality: [0.6, 0.8]
                            }),
                            imageminSvgo(),
                            imageminOpting()
                        ]
                    }) 
                }
                if(ext===".png"||ext===".jpg"||ext===".jpeg"){
                    imagemin([node.path], {
                        destination:  newDir,
                        plugins: [
                            imageminWebp()
                        ]
                    }) 
                }
            }
        }
    });
});