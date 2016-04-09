import $ from 'jquery';
import Chance from 'chance';
//import CaretManager from './CaretManager';

const chance = new Chance();

export default class LineManager {

  constructor(container) {
    this.container = container;
    //this.caretManager = new CaretManager(container);
    this.lineDict = []; // [LineNumber] => Hash
  }

  coop(caretManager) {
    this.caretManager = caretManager;
  }

  lineBuilder(lineNumber, reorder) {
    let lineHash = chance.hash({ length: 5 });
    while (this.lineDict.indexOf(lineHash) > -1) {
      lineHash = chance.hash({ length: 5 })
    }
    if (reorder) {
      this.lineDict.splice(lineNumber, 0, lineHash);
    } else {
      this.lineDict[lineNumber] = lineHash;
    }

    let $line = $('<div>', {
      class: 'line',
      html: '<br>',
      'data-lh': lineHash, // Line hash
      'data-md': '', // Markdown
      'data-rh': '' // HTML for rendering
    });

    this.length += 1;

    return $line.get(0);
  }

  getCurrentLineElement() {
    let el = this.caretManager.get().lineEl;
    if ($(el).parents('.line').length) {
      el = $(el).parents('.line').get(0);
    }
    return el;
  }

  getLineNumberByLineElement(el) {
    const lineHash = $(el).attr('data-lh');
    const lineNumber = this.lineDict.indexOf(lineHash);

    if (lineNumber > 0) {
      return lineNumber;
    } else {
      throw '? Element'
    }
  }

  init() {
    let firstLine = this.lineBuilder(1);
    $(this.container).html(firstLine);
    this.length = 1;
  }

  get(lineNumber) {
    if (lineNumber) {
      const lineHash = this.lineDict[lineNumber];
      if ($(this.container).find(`.line[data-lh=${lineHash}]`).length) {
        return $(this.container).find(`.line[data-lh=${lineHash}]`).get(0);
      } else {
        return null;
      }
    } else {
      // Current line
      return this.getCurrentLineElement();
    }
  }

  insert(lineNumber, inner) {
    const occupied = this.get(lineNumber);
    let newLine;
    if (occupied) {
      newLine = this.lineBuilder(lineNumber, true);
      $(newLine).insertBefore(occupied);
    } else {
      // EOF
      newLine = this.lineBuilder(lineNumber);
      $(this.container).append(newLine);
    }
    if (inner) {
      $(newLine).html(inner);
    }
  }

  remove(lineNumber) {
    $(this.get(lineNumber)).remove();
    this.lineDict.splice(lineNumber, 1);
    this.length -= 1;
  }

  focus(lineNumber) {
    $(this.container).find('.line').removeClass('focus');
    const focusLine = this.get(lineNumber);
    $(focusLine).addClass('focus');
  }

  getLineDict() {
    return this.lineDict;
  }
}
