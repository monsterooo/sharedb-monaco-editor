class Adapter {
  constructor(instance, options = { key: 'content' }) {
    this.monaco = instance;
    this.model = this.monaco.getModel();
    this.lastDocLines = this.model.getLinesContent();
    this.key = options.key;

    this.onChange = this.onChange.bind(this);
    this.handleChange = this.monaco.onDidChangeModelContent(this.onChange);
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
    const content = this.lastDocLines.join(this.model.getEOL());
    const op = this.createOpFormChange(event, content);
    this.lastDocLines = this.model.getLinesContent();
    console.log(op);
  }

  createOpFormChange(event, content) {
    const op = [];
    event.changes.forEach((change) => {
      const { text, rangeLength, rangeOffset } = change;
      let replacedText = '';
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

export default Adapter;
