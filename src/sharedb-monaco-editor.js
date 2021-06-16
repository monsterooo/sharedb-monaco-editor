// eslint-disable-next-line
import * as monacoSource from "monaco-editor";

const MONACO_EDITOR_OP_SOURCE = "MonacoEditor";
class ShareDBMonacoEditor {
  constructor(monaco, options = { key: "content" }) {
    this.monaco = monaco;
    this.model = this.monaco.getModel();
    this.key = options.key;
    this.onOp = options.onOp;
    this.onStart = options.onStart;
    this.onStop = options.onStop;
    this.started = false;
    this.suppressChange = false;
    this.onChange = this.onChange.bind(this);

    this.getLastDocLines();
  }

  static attachDoc(
    shareDoc,
    monaco,
    options = { key: "conetnt" },
    callback = () => {}
  ) {
    const { key } = options;
    let shareDBMonacoEditor;
    const shareDBOpListener = (op, source) => {
      op.forEach((opPart) => {
        const { p } = opPart;
        if (p && p.length === 2 && p[0] === key) {
          shareDBMonacoEditor.applyOp(opPart, source);
        }
      });
    };
    shareDBMonacoEditor = new ShareDBMonacoEditor(monaco, {
      key,
      onStart: () => {
        shareDoc.on("op", shareDBOpListener);
      },
      onStop: () => {
        shareDoc.removeListener("op", shareDBOpListener);
      },
      onOp: (op) => {
        shareDoc.submitOp(op, { source: MONACO_EDITOR_OP_SOURCE });
      },
    });
    shareDoc.subscribe((err) => {
      if (err) {
        return callback(err);
      }
      shareDBMonacoEditor.setValue(shareDoc.data[key]);
      return callback(null);
    });
    return shareDBMonacoEditor;
  }

  start() {
    if (this.started) {
      return;
    }
    this.handleChange = this.monaco.onDidChangeModelContent(this.onChange);
    this.started = true;
    this.onStart();
  }

  getLastDocLines() {
    this.lastDocLines = this.model.getLinesContent();
  }

  setValue(text) {
    if (!this.started) {
      this.start();
    }
    this.suppressChange = true;
    this.model.setValue(text);
    this.getLastDocLines();
    this.suppressChange = false;
  }

  applyOp(op, source) {
    if (!this.started) {
      return;
    }
    if (source === MONACO_EDITOR_OP_SOURCE) {
      return;
    }
    this.suppressChange = true;
    this.applyChangesFromOp(op);
    this.getLastDocLines();
    this.suppressChange = false;
  }

  applyChangesFromOp(op) {
    const [, index] = op.p;
    if (op.si) {
      const pos = this.model.getPositionAt(index);
      this.monaco.executeEdits("my-source", [
        {
          range: new monacoSource.Range(
            pos.lineNumber,
            pos.column,
            pos.lineNumber,
            pos.column
          ),
          text: op.si,
          forceMoveMarkers: true,
        },
      ]);
    } else if (op.sd) {
      const from = this.model.getPositionAt(index);
      const to = this.model.getPositionAt(index + op.sd.length);
      this.monaco.executeEdits("my-source", [
        {
          range: new monacoSource.Range(
            from.lineNumber,
            from.column,
            to.lineNumber,
            to.column
          ),
          text: "",
          forceMoveMarkers: true,
        },
      ]);
    }
  }

  /**
   * monaco模型改变时发出的事件 https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html#ondidchangemodelcontent
   * @param {IModelContentChangedEvent} e // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.imodelcontentchangedevent.html
   * @property {e.changes: IModelContentChange[]}
   *    range:
   *      startColumn: 字符开始的列号   同endColumn计算方式
   *      endColumn: 字符结束的列号   列计算如: abc!  序号从a前面计算为1， 到达插入的！的时候列号为4
   *      startLineNumber: 字符串开始的行号
   *      endLineNumber: 字符串结束的行号
   *    rangeLength: 被*替换*的范围长度，只有删除、选择字符串粘贴、输入字符点击提示自动输入会存在。它表示当前被替换掉字符的长度
   *    rangeOffset: 被替换范围的偏移量(开始位置)，计算如上面*endColumn*方法一样
   *    text: 应用到编辑器的新文本，只有插入，粘贴、输入字符串点击提示会存在
   *
   * @property {e.isFlush} 编辑器丢失所有decorations，模型被重置为新值
   * @property {e.isUndoing} 撤销该值为true
   * @property {e.eol} 行尾字符串
   * @property {e.isRedoing} 撤销该值为true
   * @property {e.versionId} 操作版本号递增
   */
  onChange(event) {
    if (this.suppressChange) {
      return;
    }
    const content = this.lastDocLines.join(this.model.getEOL());
    const op = this.createOpFormChange(event, content);
    this.getLastDocLines();
    this.onOp(op);
  }

  createOpFormChange(event, content) {
    const op = [];
    event.changes.forEach((change) => {
      const { text, rangeLength, rangeOffset } = change;
      let replacedText = "";
      if (text.length === 0 && rangeLength > 0) {
        // 删除
        replacedText = content.slice(rangeOffset, rangeOffset + rangeLength);
        op.push({ p: [this.key, rangeOffset], sd: replacedText });
      } else if (text.length > 0 && rangeLength > 0) {
        // 粘贴、输入字符点击提示自动输入
        replacedText = content.slice(rangeOffset, rangeOffset + rangeLength);
        op.push({ p: [this.key, rangeOffset], sd: replacedText });
        op.push({ p: [this.key, rangeOffset], si: text });
      } else {
        op.push({ p: [this.key, rangeOffset], si: text });
      }
    });
    return op;
  }
}

export default ShareDBMonacoEditor;
