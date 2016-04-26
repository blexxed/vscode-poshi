import { IPCMessageReader, IPCMessageWriter, createConnection, TextDocuments } from 'vscode-languageserver'
import { validateCommand } from '../validator/testcaseValidator'
import { completionSource, completionInfoSource } from '../Completion/completionProvider'
// import { commandStandardRegex, commandRegex } from '../util/regexUtil'

const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process))
const documents = new TextDocuments()

documents.listen(connection)

// init
connection.onInitialize((params) => {
  //   const workspaceRoot = params.rootPath
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        resolveProvider: true
      }
    }
  }
})

// bind events
documents.onDidChangeContent(change => {
  try {
    connection.console.log('change event fire ..')

    validateTextDocument(change.document)
  } catch (error) {
    connection.console.error(error.stack)
  }
})

function validateTextDocument (doc) {
  const lines = doc.getText().split(/\r?\n/g)
  const ext = doc.uri.split('.')[1]

  let diagnostics = []

  for (let entry of lines.entries()) {
    switch (ext) {
      case 'testcase':
        validateCommand(entry, diagnostics)
        break
      case 'macro':
        break
      case 'function':
        break
      case 'path':
        break
      default:
        break
    }
  }

  connection.sendDiagnostics({uri: doc.uri, diagnostics})
}

// completion
connection.onCompletion((textDocumentPosition) => {
  return completionSource
})

connection.onCompletionResolve((item) => {
  const {detail, documentation} = completionInfoSource[item.data - 1]
  item.detail = detail
  item.documentation = documentation

  return item
})

connection.onDidChangeConfiguration((change) => {
  //   const settings = change.settings

  //   maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100

  documents.all().forEach(validateTextDocument)
})

/*
connection.onDidOpenTextDocument((params) => {
  // A text document got opened in VSCode.
  // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.text the initial full content of the document.
  connection.console.log(`${params.uri} opened.`)
})
connection.onDidChangeTextDocument((params) => {
  // The content of a text document did change in VSCode.
  // params.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`)
})
connection.onDidCloseTextDocument((params) => {
  // A text document got closed in VSCode.
  // params.uri uniquely identifies the document.
  connection.console.log(`${params.uri} closed.`)
})*/

connection.listen()
