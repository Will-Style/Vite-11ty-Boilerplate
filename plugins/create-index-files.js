
const fs = require('fs-extra') 

// index.jsファイルを生成する
export default createIndexFiles = () => ({
    name: 'create-index-files',
    configResolved: (config) => {
        if (config.command === 'serve') {
            // index作成対象のディレクトリ
            const targetDirs = [
                './src/js/models',
                './src/js/transitions'
            ]

            // ファイル一覧からexportの文を作る
            const makeIndexContent = (files) => {
                let content = ''
                let _exports = ''
                files.forEach( (item) => {
                    const file = item.replace(/\.js$/, '')
                    if (file === 'index' || file === '.DS_Store') { 
                        return 
                    }
                    content += 'import ' + file + ' from \'./' + file + '\'\n'
                    _exports += file + ','
                })
                return content + '\nexport { ' + _exports.replace(/\,$/, '') + ' };' 
            }

            targetDirs.forEach(function (dir) {
                // ファイル読み込み
                fs.readdir(dir, (err, files) => {
                if (err) throw err
                const content = makeIndexContent(files)
                    fs.writeFile(dir + '/index.js', content, function (err) {
                        if (err !== null) console.log(err)
                    })
                })
            })
        }
    }
})
