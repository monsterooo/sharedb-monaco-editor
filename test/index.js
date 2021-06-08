import assert from 'assert';
import ShareDBMonacoEditor from '../src/sharedb-monaco-editor';

const noop = () => {};
const monaco = {
  getModel: () => ({
    getLinesContent: noop,
  }),
  onDidChangeModelContent: noop,
};

describe('Array', () => {
  const shareDBMonacoEditor = new ShareDBMonacoEditor(monaco);
  const editorContent = `function main() {
  console.log('main');
}
main();
`;

  it('should default key', () => {
    assert.equal(shareDBMonacoEditor.key, 'content');
  });

  it('should add console.log("Hello, World!")', () => {
    const event = {
      changes: [
        {
          range: {
            endColumn: 1,
            endLineNumber: 5,
            startColumn: 1,
            startLineNumber: 5,
          },
          rangeLength: 0,
          rangeOffset: 51,
          text: 'console.log("Hello, World!")',
        },
      ],
    };
    const finalOp = [
      { p: ['content', 51], si: 'console.log("Hello, World!")' },
    ];
    assert.deepEqual(shareDBMonacoEditor.createOpFormChange(event, editorContent), finalOp);
  });
});
