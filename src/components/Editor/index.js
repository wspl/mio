import $ from 'jquery';

import LineManager from './LineManager';
import CaretManager from './CaretManager';
import { KeyHandle, key, isKeyWouldModify } from './KeyHandle';

export default function Editor() {

  const container = this.el;
  const lineManager = new LineManager(container);
  const caretManager = new CaretManager(container);

  lineManager.coop(caretManager);
  caretManager.coop(lineManager);

  lineManager.init();

  let isFirstFocus = true;
  $(container).on('focus', function() {
    if (isFirstFocus) {
      caretManager.init();
      isFirstFocus = false;
      lineManager.focus(1);
    }
  });

  // Render first line
  $(container).on('keydown', function(e) {
    return KeyHandle.down(e);
  });

  $(container).on('keyup', function(e) {
    return KeyHandle.up(e);
  });

  KeyHandle.bind(key.enter, function(e) {
    // Handle Text Process
    const sel = caretManager.getSelection();
    const newLineNumber = sel.startLineNumber + 1;

    if (sel.inline) {
      const keepMd = $(sel.startLine).text().substring(0, sel.startLinePos);
      const newMd = $(sel.startLine).text().substring(sel.endLinePos, $(sel.startLine).text().length);
      $(sel.startLine).html(keepMd || '<br>');
      lineManager.insert(newLineNumber, newMd);
      caretManager.select(newLineNumber, 0, 0);
    } else {
      const keepMd = $(sel.startLine).text().substring(0, sel.startLinePos);
      const newMd = $(sel.endLine).text().substring(sel.endLinePos, $(sel.endLine).text().length);

      for (let i = sel.endLineNumber - 1; i > sel.startLineNumber; i -= 1) {
        lineManager.remove(i);
      }
      $(sel.startLine).html(keepMd || '<br>');
      $(sel.endLine).html(newMd || '<br>');

      caretManager.select(newLineNumber, 0, 0);
    }

    // Handle Line Focusing
    lineManager.focus(newLineNumber);

    return false;
  }, function(e) {
    return false;
  });

  KeyHandle.bind(key.backspace, function(e) {
    // Handle Text Process
    const sel = caretManager.getSelection();

    if (sel.inline) {
      if (sel.startLinePos === 0 && sel.endLinePos === 0) {
        const prevLineNumber = sel.startLineNumber - 1;
        if (prevLineNumber === 0) return false;

        const downMd = $(sel.startLine).text();
        const upMdLength = $(lineManager.get(prevLineNumber)).text().length;
        const combinedMd = $(lineManager.get(prevLineNumber)).text() + downMd;
        $(lineManager.get(prevLineNumber)).text(combinedMd);
        if (!combinedMd) $(lineManager.get(sel.startLineNumber)).html('<br>');

        caretManager.select(prevLineNumber, upMdLength, upMdLength);
        lineManager.remove(sel.startLineNumber);
        lineManager.focus(prevLineNumber);

        return false;
      }
    } else {
      const downMdLength = $(sel.endLine).text().length;
      const downMd = $(sel.endLine).text().substring(sel.endLinePos, downMdLength);
      const upMd = $(sel.startLine).text().substring(0, sel.startLinePos);
      const combinedMd = upMd + downMd;
      $(lineManager.get(sel.startLineNumber)).text(combinedMd);
      if (!combinedMd) $(lineManager.get(sel.startLineNumber)).html('<br>');

      caretManager.select(sel.startLineNumber, sel.startLinePos, sel.startLinePos);
      for (let i = sel.endLineNumber; i > sel.startLineNumber; i -= 1) {
        lineManager.remove(i);
      }
      lineManager.focus(sel.startLineNumber);

      return false;
    }
  });

  KeyHandle.bind(key.upArrow, function(e) {
    console.log(caretManager.getRaw());
    const targetLineNumber = caretManager.get().lineNumber - 1;
    if (targetLineNumber > 0) {
      lineManager.focus(targetLineNumber);
    } else {
      return false;
    }
  });

  KeyHandle.bind(key.downArrow, function(e) {
    const targetLineNumber = caretManager.get().lineNumber + 1;
    if (targetLineNumber < lineManager.length + 1) {
      lineManager.focus(targetLineNumber);
    } else {
      return false;
    }
  });

  KeyHandle.bind(key.leftArrow, function(e) {
    const sel = caretManager.getSelection();
    const targetLineNumber = sel.startLineNumber - 1;
    if (sel.startLineNumber === sel.endLineNumber &&
        sel.startLinePos === 0 &&
        targetLineNumber > 0) {
      lineManager.focus(targetLineNumber);
    }
  });

  KeyHandle.bind(key.rightArrow, function(e) {
    const sel = caretManager.getSelection();
    const targetLineNumber = sel.endLineNumber + 1;
    const currentLineLength = $(lineManager.get(sel.endLineNumber)).text().length;
    if (sel.startLineNumber === sel.endLineNumber &&
      sel.startLinePos === currentLineLength &&
      targetLineNumber < lineManager.length + 1) {
      lineManager.focus(targetLineNumber);
    }
  });

  KeyHandle.bind(key.all, function(e) {
    const sel = caretManager.getSelection();

    // Press the keys which would modify content
    if (isKeyWouldModify(e.which)) {

      // Modification would remove line(s)
      if (sel.startLineNumber !== sel.endLineNumber) {
        const downMdLength = $(sel.endLine).text().length;
        const downMd = $(sel.endLine).text().substring(sel.endLinePos, downMdLength);
        const upMd = $(sel.startLine).text().substring(0, sel.startLinePos);
        const combinedMd = upMd + downMd;
        $(lineManager.get(sel.startLineNumber)).text(combinedMd);
        if (!combinedMd) $(lineManager.get(sel.startLineNumber)).html('<br>');

        caretManager.select(sel.startLineNumber, sel.startLinePos, sel.startLinePos);
        for (let i = sel.endLineNumber; i > sel.startLineNumber; i -= 1) {
          lineManager.remove(i);
        }
        lineManager.focus(sel.startLineNumber);

        return false;
      }
    }
  });

  $(container).on('mousedown mouseup', function(e) {
    let lineEl;
    if ($(e.toElement).hasClass('line')) {
      lineEl = e.toElement;
    } else {
      lineEl = $(e.toElement).parents('.line').get(0);
    }

    if (lineEl) {
      lineManager.focus(lineManager.getLineNumberByLineElement(lineEl));
    }
  });

}
