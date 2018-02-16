(function() {

const nonogrammer = require('../index');

function getURLParam(name) {
	let res = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return res && res[1] && decodeURIComponent(res[1]);
}

function getURLParamInt(name, def) {
	let res = getURLParam(name);
	if (typeof res !== 'string' || res === '') return def;
	return parseInt(res);
}

let mode = getURLParam('mode');
if (mode !== 'solve' && mode !== 'build') mode = 'play';

function setBoardCellValue(cell, value, palette) {
	let paletteObj = palette && palette[value === null ? 'unknown' : value];
	if (paletteObj && paletteObj.text) {
		cell.text(paletteObj.text);
	} else if (!paletteObj && value === null) {
		cell.text('?');
	} else {
		cell.text('');
	}
	if (paletteObj && paletteObj.textColor) {
		cell.css('color', paletteObj.textColor);
	} else if (value === null) {
		cell.css('color', 'red');
	} else {
		cell.css('color', 'black');
	}
	if (paletteObj && paletteObj.color) {
		cell.css('background-color', paletteObj.color);
	} else if (value > 0) {
		cell.css('background-color', 'black');
	} else {
		cell.css('background-color', 'white');
	}
}

function refreshPuzzleUI(board, boardElem, palette) {
	// Update board size
	let boardElemRows = boardElem.find('tr').length - 1;
	let boardElemCols = boardElem.find('td').length / (boardElemRows + 1) - 1;
	while (boardElemRows < board.rows) {
		let newRowElem = $('<tr>');
		let rowClueCell = $('<td>').addClass('nonogramRowClueCell').data('row', boardElemRows).data('nonoRowClue', true);
		newRowElem.append(rowClueCell);
		for (let col = 0; col < boardElemCols; col++) {
			let cell = $('<td>').addClass('nonogramDataCell').data('row', boardElemRows).data('col', col).data('nonoCell', true);
			newRowElem.append(cell);
		}
		boardElem.find('tr').last().after(newRowElem);
		boardElemRows++;
	}
	while (boardElemRows > board.rows) {
		boardElem.find('tr').last().remove();
		boardElemRows--;
	}
	while (boardElemCols < board.cols) {
		boardElem.find('tr').each(function(idx) {
			let newCell = $('<td>');
			if (idx === 0) {
				// Clue cell
				newCell.addClass('nonogramColClueCell').data('col', boardElemCols).data('nonoColClue', true);
			} else {
				// Data cell
				newCell.addClass('nonogramDataCell').data('row', idx - 1).data('col', boardElemCols).data('nonoCell', true);
			}
			$(this).append(newCell);
		});
		boardElemCols++;
	}
	while (boardElemCols > board.cols) {
		boardElem.find('tr').each(function() {
			$(this).find('td').last().remove();
		});
		boardElemCols--;
	}

	// Update each of the cells
	boardElem.find('td').each(function() {
		let el = $(this);
		let row = el.data('row');
		let col = el.data('col');
		if (row !== undefined) row = parseInt(row);
		if (col !== undefined) col = parseInt(col);
		let isDataCell = el.data('nonoCell');
		let isRowClue = el.data('nonoRowClue');
		let isColClue = el.data('nonoColClue');
		if (row !== undefined && col !== undefined && isDataCell) {
			// Update data cell
			let value = board.get(row, col);
			setBoardCellValue(el, value, palette);
		} else if (row !== undefined && isRowClue) {
			// Update row clue cell
			el.empty();
			for (let clue of board.rowClues[row]) {
				let rowClueSpan = $('<span>').addClass('nonogramRowClue').text('' + clue.run);
				if (palette && palette[clue.value] && palette[clue.value].color) {
					rowClueSpan.css('color', palette[clue.value].color);
				}
				el.append(rowClueSpan);
			}
		} else if (col !== undefined && isColClue) {
			// Update col clue cell
			el.empty();
			for (let clue of board.colClues[col]) {
				let clueDiv = $('<div>').addClass('nonogramColClue').text('' + clue.run);
				if (palette && palette[clue.value] && palette[clue.value].color) {
					clueDiv.css('color', palette[clue.value].color);
				}
				el.append(clueDiv);
			}
		}
	});
}

function makePuzzleUI(board, palette = null) {
	let table = $('<table>').addClass('nonogramTable');
	// Build column clue row
	let columnClueRow = $('<tr>');
	let topLeftSpacer = $('<td>');
	columnClueRow.append(topLeftSpacer);
	for (let colNum = 0; colNum < board.cols; colNum++) {
		let clues = board.colClues[colNum];
		let colClueCell = $('<td>').addClass('nonogramColClueCell').data('col', colNum).data('nonoColClue', true);
		for (let clue of clues) {
			let clueDiv = $('<div>').addClass('nonogramColClue').text('' + clue.run);
			if (palette && palette[clue.value] && palette[clue.value].color) {
				clueDiv.css('color', palette[clue.value].color);
			}
			colClueCell.append(clueDiv);
		}
		columnClueRow.append(colClueCell);
	}
	table.append(columnClueRow);
	// Build other rows
	for (let rowNum = 0; rowNum < board.rows; rowNum++) {
		let rowRow = $('<tr>');
		let rowClueCell = $('<td>').addClass('nonogramRowClueCell').data('row', rowNum).data('nonoRowClue', true);
		for (let clue of board.rowClues[rowNum]) {
			let rowClueSpan = $('<span>').addClass('nonogramRowClue').text('' + clue.run);
			if (palette && palette[clue.value] && palette[clue.value].color) {
				rowClueSpan.css('color', palette[clue.value].color);
			}
			rowClueCell.append(rowClueSpan);
		}
		rowRow.append(rowClueCell);
		let rowData = board.getRow(rowNum);
		for (let colNum = 0; colNum < rowData.length; colNum++) {
			let value = rowData[colNum];
			let cell = $('<td>').addClass('nonogramDataCell').data('row', rowNum).data('col', colNum).data('nonoCell', true);
			setBoardCellValue(cell, value, palette);
			rowRow.append(cell);
		}
		table.append(rowRow);
	}
	return table;
}

let paletteColorSet = [ 'white', 'black', 'red', 'yellow', 'green', 'blue', 'orange', 'purple' ];
let palette = [];

function paletteSelectorAddColor(onChange = null) {
	if (palette.length >= paletteColorSet.length) return;
	let idx = palette.length;
	palette.push({ color: paletteColorSet[idx], colorIdx: idx });
	let colorSpan = $('<span>').addClass('nonogramPalSelBlock');
	colorSpan.css('background-color', palette[idx].color);
	//$('#paletteSelector').append(colorSpan);
	//palette[idx].el = colorSpan;
	colorSpan.click(function() {
		if (idx === 0) return;
		palette[idx].colorIdx++;
		if (palette[idx].colorIdx >= paletteColorSet.length) palette[idx].colorIdx = 0;
		palette[idx].color = paletteColorSet[palette[idx].colorIdx];
		colorSpan.css('background-color', palette[idx].color);
		if (onChange) onChange();
	});
	let colorSpanPadding = $('<span>').addClass('nonogramPalSelBlockPad');
	colorSpanPadding.append(colorSpan);
	$('#paletteSelector').append(colorSpanPadding);
	palette[idx].el = colorSpanPadding;
}

function paletteSelectorRemoveColor() {
	if (palette.length < 3) return;
	palette.pop().el.remove();
}

function resetPaletteSelector(onChange = null) {
	palette = [];
	$('#paletteSelector').empty();
	paletteSelectorAddColor(onChange);
	paletteSelectorAddColor(onChange);
	palette.unknown = { color: 'white' };
}

function initPaletteSelector(callbacks = {}) {
	resetPaletteSelector(callbacks.onChange);
	$('#paletteAddButton').off('click').click(() => {
		paletteSelectorAddColor(callbacks.onChange);
		if (callbacks.onAdd) callbacks.onAdd();
	});
	$('#paletteRemoveButton').off('click').click(() => {
		paletteSelectorRemoveColor();
		if (callbacks.onRemove) callbacks.onRemove();
	});
}

function initResizeSelector(board, boardEl, defaultValue = 0, resizeCb = null) {
	$('#addRowButton').off('click').click(() => {
		board.resize(board.rows + 1, board.cols, defaultValue);
		refreshPuzzleUI(board, boardEl, palette);
		if (resizeCb) resizeCb();
	});
	$('#removeRowButton').off('click').click(() => {
		board.resize(board.rows - 1, board.cols, defaultValue);
		refreshPuzzleUI(board, boardEl, palette);
		if (resizeCb) resizeCb();
	});
	$('#addColButton').off('click').click(() => {
		board.resize(board.rows, board.cols + 1, defaultValue);
		refreshPuzzleUI(board, boardEl, palette);
		if (resizeCb) resizeCb();
	});
	$('#removeColButton').off('click').click(() => {
		board.resize(board.rows, board.cols - 1, defaultValue);
		refreshPuzzleUI(board, boardEl, palette);
		if (resizeCb) resizeCb();
	});
}

function initEditBoard(board, boardEl, allowUnknown, onChange) {
	boardEl.find('.nonogramDataCell').off('mousedown').mousedown((event) => {
		let el = $(event.target);
		let row = parseInt(el.data('row'));
		let col = parseInt(el.data('col'));
		let value = board.get(row, col);
		let newValue = value;
		if (event.which === 1) {
			// left click cycles between colors
			if (value === null) {
				newValue = 1;
			} else if (value === 0 && allowUnknown) {
				newValue = null;
			} else {
				newValue = value + 1;
				if (newValue >= palette.length) {
					newValue = 0;
				}
			}
		} else if (event.which === 3) {
			// right click toggles between unknown and blank
			if (!allowUnknown) return;
			if (value === null) newValue = 0;
			else newValue = null;
		}
		if (newValue !== value) {
			board.set(row, col, newValue);
			let res = onChange(row, col, newValue, value);
			if (res === false) {
				board.set(row, col, value);
			}
			setBoardCellValue(el, board.get(row, col), palette);
		}
	}).on('contextmenu', () => false);
}

function disableEditBoard(boardEl) {
	boardEl.find('.nonogramDataCell').off('mousedown');
}

function initBuilder(allowUnknown = false, editCb) {
	$('#paletteSelectorContainer').show();
	$('#resizeContainer').show();
	$('#puzzleContainer').empty();
	$('#solvedMessage').hide();

	let width = getURLParamInt('w', 5);
	let height = getURLParamInt('h', 5);

	let board = new nonogrammer.Board(height, width);

	let boardEl = makePuzzleUI(board, palette);
	initEditBoard(board, boardEl, allowUnknown, editCb);

	initPaletteSelector({
		onRemove() {
			for (let i = 0; i < board.data.length; i++) {
				if (board.data[i] !== null && board.data[i] >= palette.length) {
					board.data[i] = 0;
				}
			}
			board.buildCluesFromData();
			refreshPuzzleUI(board, boardEl, palette);
		},
		onChange() {
			refreshPuzzleUI(board, boardEl, palette);
		}
	});
	if (allowUnknown) {
		palette[0] = { color: 'white', textColor: 'grey', text: 'X' };
	} else {
		palette[0] = { color: 'white' };
	}

	initResizeSelector(board, boardEl, allowUnknown ? null : 0, () => {
		initEditBoard(board, boardEl, allowUnknown, editCb);
	});

	$('#puzzleContainer').append(boardEl);

	return {
		board,
		boardEl
	};
}

function initBuildMode() {
	let builder;
	builder = initBuilder(false, (row, col) => {
		builder.board.buildCluesFromData();
		refreshPuzzleUI(builder.board, builder.boardEl, palette);
	});
	$('#generateContainer').show();
	$('#generateButton').off('click').click(() => {
		let difficulty = parseInt($('#generateDifficulty').val());
		if (typeof difficulty !== 'number') difficulty = 3;
		if (difficulty < 1) difficulty = 1;
		if (difficulty > 10) difficulty = 10;
		let buildResult = nonogrammer.Builder.buildPuzzleFromData(builder.board, difficulty);
		let buildResultEl = makePuzzleUI(buildResult.board, palette);
		$('#generatePuzzleContainer').empty().append(buildResultEl);
	});
}

function initPlayMode() {
	$('#paletteSelectorContainer').hide();
	$('#puzzleContainer').empty();
	$('#solvedMessage').hide();
	$('#resizeContainer').hide();
	$('#generateContainer').hide();

	let width = getURLParamInt('w', 5);
	let height = getURLParamInt('h', 5);
	let colors = getURLParamInt('colors', 1);
	let difficulty = getURLParamInt('difficulty', 3);

	$('#playNextWidth').val('' + width);
	$('#playNextHeight').val('' + height);
	$('#playNextColors').val('' + colors);
	$('#playNextDifficulty').val('' + difficulty);

	let filledBoard = nonogrammer.Board.makeRandomBoard(height, width, colors);
	let buildResults = nonogrammer.Builder.buildPuzzleFromData(filledBoard, difficulty);
	let puzzleBoard = nonogrammer.Solver.partialCopyBoard(buildResults.board);
	console.log('Created board solution stats: ', buildResults.stats);
	resetPaletteSelector();
	palette[0] = { color: 'white', textColor: 'grey', text: 'X' };
	let maxValue = filledBoard.getMaxValue();
	while (palette.length <= maxValue) paletteSelectorAddColor();
	let boardEl = makePuzzleUI(puzzleBoard, palette);
	initEditBoard(puzzleBoard, boardEl, true, (row, col) => {
		if (buildResults.board.get(row, col) !== null) return false;
		if (puzzleBoard.validate(true)) {
			// Solved the puzzle
			// Transform all unknowns to blanks, and update the palette
			palette[0] = { color: 'white', text: '' };
			for (let row = 0; row < puzzleBoard.rows; row++) {
				for (let col = 0; col < puzzleBoard.cols; col++) {
					let value = puzzleBoard.get(row, col);
					if (value === null) {
						puzzleBoard.set(row, col, 0);
					}
				}
			}
			refreshPuzzleUI(puzzleBoard, boardEl, palette);
			disableEditBoard(boardEl);
			$('#solvedMessage').show();
		}
	});
	$('#puzzleContainer').append(boardEl);
}

$(function() {

	//let board = nonogrammer.Board.makeRandomBoard(10, 10, 1);
	//$('body').append(makePuzzleUI(board));
	if (mode === 'play') {
		initPlayMode();
	} else if (mode === 'build') {
		initBuildMode();
	}

});

})();

