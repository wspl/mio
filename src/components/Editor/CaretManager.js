import $ from 'jquery';
import rangy from 'rangy';
import 'rangy/lib/rangy-textrange';
import LineManager from './LineManager';

export default class CaretManager {

  constructor(container) {
    this.container = container;
  }

  coop(lineManager) {
    this.lineManager = lineManager;
  }

  init() {
    let range = new Range();
    let firstLine = this.lineManager.get(1);
    range.setStart(firstLine, 0);
    range.setEnd(firstLine, 0);
    rangy.getSelection().setSingleRange(range);
  }

  getRaw() {
    if (rangy.getSelection().focusNode.id === 'editor') return;

    let lineEl;
    if ($(rangy.getSelection().focusNode).hasClass('line')) {
      lineEl = rangy.getSelection().focusNode;
    } else {
      lineEl = $(rangy.getSelection().focusNode).parents('.line').get(0);
    }

    return rangy.getSelection(lineEl);
  }

  get() {
    if (rangy.getSelection().focusNode.id === 'editor') return;

    let lineEl;
    if ($(rangy.getSelection().focusNode).hasClass('line')) {
      lineEl = rangy.getSelection().focusNode;
    } else {
      lineEl = $(rangy.getSelection().focusNode).parents('.line').get(0);
    }

    const textRange = rangy.getSelection().saveCharacterRanges(lineEl);

    return {
      lineNumber: this.lineManager.getLineNumberByLineElement(lineEl),
      lineEl: lineEl,
      startPos: textRange[0].characterRange.start,
      endPos: textRange[0].characterRange.end,
      textRange: textRange
    };
  }

  select(lineNumber, start, end) {
    const el = this.lineManager.get(lineNumber);
    let range = rangy.createRange();
    range.selectCharacters(el, start, end);
    rangy.getSelection().setSingleRange(range);
  }

  getSelection() {
    const caret = this.get();
    const lineNumber = caret.lineNumber;
    const startPos = caret.startPos;
    const endPos = caret.endPos;
    const el = caret.lineEl;

    if (startPos >= 0 && endPos <= $(el).text().length) { // Single Line
      return {
        inline: true,
        startLineNumber: lineNumber,
        startLinePos: startPos,
        startLine: el,
        endLineNumber: lineNumber,
        endLinePos: endPos,
        endLine: el
      }
    } else { // Multiple Line
      let startLineNumber, startLinePos, startLine,
        endLineNumber, endLinePos, endLine;

      if (startPos < 0) {
        // Selecting from top to bottom
        const selectSize = -startPos;
        let leftSize = selectSize;
        let currentLineNumber = lineNumber;

        while(leftSize > 0) {
          currentLineNumber -= 1;
          leftSize -= $(this.lineManager.get(currentLineNumber)).text().length + 1;
        }

        startLineNumber = currentLineNumber;
        startLinePos = -leftSize;
        startLine = this.lineManager.get(startLineNumber);
        endLineNumber = lineNumber;
        endLinePos = endPos;
        endLine = el;
      } else {
        // Selecting from bottom to top
        const selectSize = endPos - startPos;
        let leftSize = selectSize - ($(el).text().length - startPos + 1);
        let currentLineNumber = lineNumber;

        while(leftSize > 0) {
          currentLineNumber += 1;
          leftSize -= $(this.lineManager.get(currentLineNumber)).text().length + 1;
        }

        startLineNumber = lineNumber;
        startLinePos = startPos;
        startLine = el;
        endLineNumber = currentLineNumber;
        endLinePos = $(this.lineManager.get(endLineNumber)).text().length + leftSize + 1;
        endLine = this.lineManager.get(endLineNumber);
      }

      return {
        startLineNumber,
        startLinePos,
        startLine,
        endLineNumber,
        endLinePos,
        endLine,
        inline: false
      }
    }
  }

}
