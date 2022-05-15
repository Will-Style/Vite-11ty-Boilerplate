require('dotenv').config({ path: `.env/.env.${process.env.NODE_ENV}` })

import path from 'path'
import { defineConfig } from 'vite'
import sassGlobImports from 'vite-plugin-sass-glob-import';
import envStringToBoolean from "./plugins/env-string-to-boolean"
import createIndexFiles from "./plugins/create-index-files"
import { eleventyPlugin } from 'vite-plugin-eleventy';


export default defineConfig(({ command ,mode }) => {

    return {
        root: process.env.OUTPUT_DIR,
        envDir: './.env/',
        base:command === 'serve' ? '/' : `/${process.env.OUTPUT_DIR}/${process.env.DEST_DIR}/`,
        server: {
            open: true,
            port: 3000,
            fs :{
                strict:false,
                allow:["../"]
            }
        },
        plugins: [
            sassGlobImports(),
            envStringToBoolean(),
            createIndexFiles(),
            command === 'serve'? eleventyPlugin(): ""
        ],
        clearScreen: false,
        middlewareMode: 'ssr',
        css: {
            // Vue等のScoped CSSでsassに変数を追加する場合の記述
            // preprocessorOptions: {
            //     sass: {
            //         additionalData: [
            //             '@import "src/scss/global/_variables.scss"',
            //             '',
            //         ].join('\n'),
            //     },
            // },
            sass: {
                plugins: [
                    require('autoprefixer'),
                ]
            }
        },
        resolve: {
            alias:[
                {
                    find: '~',
                    replacement: path.resolve(__dirname, 'src/')
                },
                {
                    find: /(.)*\.\.\/img/,
                    replacement:( command === 'serve' ) ? path.resolve(__dirname,'src/img'): 'src/img'
                },
            ]
        },
        build: {
            outDir: `${process.env.DEST_DIR}`,
            rollupOptions: {
                input: [
                    'src/js/app.js',
                    'src/scss/style.scss',
                ],
                output: {
                    entryFileNames: 'js/main.js',
                    assetFileNames: (assetInfo) => {
                        let extType = assetInfo.name.split('.')[1];
                        if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                            return assetInfo.name.replace("src/", "")
                        }
                        return `${extType}/[name][extname]`;
                    },
                    chunkFileNames: 'js/[name].js'
                },
                
            }
        }
    }
})

