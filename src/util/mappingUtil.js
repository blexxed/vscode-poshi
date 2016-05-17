import * as rd from 'rd'
import * as fs from 'fs'
import * as reg from './regexUtil'
import * as fileUtil from './fileUtil'

export const typeMapping = {
  testcase: 'testcase',
  macro: 'macro',
  function: 'function',
  locator1: 'path'
}

export const mapping = {
  testcase: new Map(),
  macro: new Map(),
  function: new Map(),
  path: new Map()
}

export const initMapping = function (url) {
  rd.eachSync(url, function (f, s) {
    const ext = fileUtil.getExtName(f)
    const name = fileUtil.getFileName(f)

    if (mapping[ext]) {
      mapping[ext].set(name, {uri: f, name: `${name}.${ext}`})
    }
  })
}

/* mappingLocator
{ fileName: new Map() }
*/

export const mappingLocator = {}

export const initMappingLocator = function () {
  const pathSources = mapping.path
  const promises = []

  for (const [name, file] of pathSources) {
    promises.push(new Promise((res, rej) => {
      fs.readFile(file.uri, 'utf-8', (err, data) => {
        if (err) rej(err)

        const match = data.match(reg.locatorBlock)
        const mapArray = []

        if (match) {
          match.forEach((e, i) => {
            const locatorArray = []

            e.split(reg.linesRegex).forEach(e => {
              const match = e.match(reg.locatorLine)

              locatorArray.push(match ? match[1] : 'null')
            })

            mapArray.push(locatorArray)
          })

          res(new Map(mapArray))
        }
      })
    }).then(map => {
      mappingLocator[name] = map
    }))
  }
}
