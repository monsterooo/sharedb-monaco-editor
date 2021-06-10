import assert from "assert";
import ShareDBMonacoEditor from "../src/sharedb-monaco-editor";

const noop = () => {};
const monaco = {
  getModel: () => ({
    getLinesContent: noop,
  }),
  onDidChangeModelContent: noop,
};

describe("test binding", () => {
  const shareDBMonacoEditor = new ShareDBMonacoEditor(monaco);
  const editorContent = `function main() {
  console.log('main');
}
main();
`;

  it("should default key", () => {
    assert.equal(shareDBMonacoEditor.key, "content");
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
      { p: ["content", 51], si: 'console.log("Hello, World!")' },
    ];
    assert.deepEqual(
      shareDBMonacoEditor.createOpFormChange(event, editorContent),
      finalOp
    );
  });

  it("should add multiple value", () => {
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
          text: "a",
        },
        {
          range: {
            endColumn: 8,
            endLineNumber: 4,
            startColumn: 8,
            startLineNumber: 4,
          },
          rangeLength: 0,
          rangeOffset: 50,
          text: "a",
        },
      ],
    };
    const finalOp = [
      { p: ["content", 51], si: "a" },
      { p: ["content", 50], si: "a" },
    ];
    assert.deepEqual(
      shareDBMonacoEditor.createOpFormChange(event, editorContent),
      finalOp
    );
  });

  it("should remove a", () => {
    const event = {
      changes: [
        {
          range: {
            endColumn: 12,
            endLineNumber: 1,
            startColumn: 11,
            startLineNumber: 1,
          },
          rangeLength: 1,
          rangeOffset: 10,
          text: "",
        },
      ],
    };
    const finalOp = [{ p: ["content", 10], sd: "a" }];
    assert.deepEqual(
      shareDBMonacoEditor.createOpFormChange(event, editorContent),
      finalOp
    );
  });

  it("should add addEventListener by tip", () => {
    const editContent2 = `function main() {
  console.log('main');
}
main();
a`;
    const event1 = {
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
          text: "a",
        },
      ],
    };
    const event2 = {
      changes: [
        {
          range: {
            endColumn: 2,
            endLineNumber: 5,
            startColumn: 1,
            startLineNumber: 5,
          },
          rangeLength: 1,
          rangeOffset: 51,
          text: "addEventListener",
        },
      ],
    };
    const finalOp1 = [{ p: ["content", 51], si: "a" }];
    const finalOp2 = [
      { p: ["content", 51], sd: "a" },
      { p: ["content", 51], si: "addEventListener" },
    ];
    assert.deepEqual(
      shareDBMonacoEditor.createOpFormChange(event1, editorContent),
      finalOp1
    );

    assert.deepEqual(
      shareDBMonacoEditor.createOpFormChange(event2, editContent2),
      finalOp2
    );
  });
});
