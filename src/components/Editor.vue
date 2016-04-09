<style>
  #editor {
    height: 1000px;
    width: 25ch;
    font-family: Consolas, DengXian;
  }

  .h1 {
    font-size: 32px;
    font-weight: bold;
  }

  .h2 {
    font-size: 28px;
    font-weight: bold;
  }

  .h3 {
    font-size: 24px;
    font-weight: bold;
  }

  .h4 {
    font-size: 20px;
    font-weight: bold;
  }

  .h5 {
    font-size: 16px;
    font-weight: bold;
  }

  .h6 {
    font-size: 12px;
    font-weight: bold;
  }

  .line {
    white-space: pre-wrap;
  }

  .line.focus {
    background-color: #ddffff;
  }
</style>

<template>
  <div id="editor" contenteditable="true" v-editor></div>
</template>

<script>
  import Vue from 'vue';
  import Editor from './Editor/';

  Vue.directive('editor', {bind: Editor});

  export default {el: '#editor'}


  function editor() {
    $(this.el).html('<div class="line"><br/></div>');

    function getLine() {
      let line = {};

      var el = rangy.getSelection().focusNode;
      if ($(el).parents('.line').length) {
        el = $(el).parents('.line').get(0);
      }
      line.el = el;

      line.lineNumber = $(line.el).index();
      line.container = $('#editor').get(0);
      line.text = $(line.el).text();
      line.html = $(line.el).html();

      line.clear = function () {
        $(this.el).replaceWith('<div class="line"><br/></div>');
        let range = new Range();
        range.setStart(this.container, this.lineNumber);
        range.setEnd(this.container, this.lineNumber);
        rangy.getSelection().setSingleRange(range);
      };

      return line;
    }

    let linesCache = new Map();

    $(this.el).on('keydown', function (e) {
      let line = getLine();
      linesCache.set(line.lineNumber, line);

      // Arrow Up
      if (e.which === 38) {
        if (line.lineNumber !== 0) {
          $(line.container).find('.focus').removeClass('focus');
          $(line.el).prev().addClass('focus');
        }
      }

      // Arrow Down
      if (e.which === 40) {
        if (line.lineNumber !== $(line.container).find('.line').length - 1) {
          $(line.container).find('.focus').removeClass('focus');
          $(line.el).next().addClass('focus');
        }
      }

      // Arrow Left
      if (e.which === 37) {
        if (line.lineNumber !== 0
          && rangy.getSelection().getRangeAt(0).startOffset === 0) {
          $(line.container).find('.focus').removeClass('focus');
          $(line.el).prev().addClass('focus');
        }
      }

      // Arrow Right
      if (e.which === 39) {
        if (line.lineNumber !== $(line.container).find('.line').length - 1
          && rangy.getSelection().getRangeAt(0).startOffset === $(line.el).text().length) {
          $(line.container).find('.focus').removeClass('focus');
          $(line.el).next().addClass('focus');
        }
      }

      if (e.which === 13) return onEnter(line);
      //onEdit(line);
      if (e.which === 8) return onBackspace(line);
    });

    $(this.el).on('keyup', function (e) {
      let line = getLine();
      let oldLine = linesCache.get(line.lineNumber);

      if (!oldLine || (line.html !== oldLine.html)) {
        onEdit(line);
      }
    });

    function onEdit(line) {
      line.el.className = 'line focus';

      // Heading
      const headingResult = line.text.match(/^ *(#{1,6})/);
      const heading = headingResult ? headingResult[0].length : 0;
      if (heading || $(line.el).attr('data-type') === 'heading') {
        const plainText = line.text
          .substring(heading, line.text.length)
          .replace(/^\s/, '');
        $(line.el)
          .addClass('h' + heading)
          .attr('data-type', 'heading')
          .attr('data-text', plainText);
        if (!$(line.el).text().replace(/\s+/g, '')) {
          line.clear();
        }
      }
    }

    function onBackspace(line) {
      if (line.lineNumber === 0 && !$(line.el).text()) {
        return false;
      }

      if (!$(line.el).text()) {
        $(line.el).prev().addClass('focus');
        return true;
      }

      let range = rangy.getSelection().getRangeAt(0);
      if (range.startOffset === 0) {
        const currentLineRaw = $(line.el).html();
        const prevLineRaw = $(line.el).prev().html();
        const upNode = $(line.el).prev().get(0).firstChild;
        const upOffset = $(line.el).prev().text().length;

        $(line.el).prev().html(prevLineRaw + currentLineRaw);
        $(line.el).prev().addClass('focus');

        range.setStart(upNode, upOffset);
        range.setEnd(upNode, upOffset);
        rangy.getSelection().setSingleRange(range);

        $(line.el).remove();
        return false;
      }

      return true;
    }

    function onEnter(line) {
      // console.log(line.el, line.lineNumber, line.container);
      $(line.container).find('.focus').removeClass('focus');

      // Judge "is new empty line"
      let range = rangy.getSelection().getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;
      const leftText = line.text.substring(0, startOffset);
      const rightText = line.text.substring(endOffset, line.text.length);

      // New range of new line
      range.setStart(line.container, line.lineNumber + 1);
      range.setEnd(line.container, line.lineNumber + 1);

      let newLine;

      if (!rightText) { // Is new empty line
        newLine = $('<div class="line focus"><br/></div>').get(0);
      } else { // Not new empty line
        if (leftText) {
          $(line.el).text(leftText);
        } else {
          $(line.el).html('<br/>');
        }
        newLine = $(`<div class="line">${rightText}</div>`).get(0);
      }

      range.insertNode(newLine);
      range.setStart(newLine, 0);
      range.setEnd(newLine, 0);
      rangy.getSelection().setSingleRange(range);

      return false;
    }

    this.el.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, text);
    });
  }
</script>
