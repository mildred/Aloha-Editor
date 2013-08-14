define([
	'../../src/arrays',
	'../../src/dom',
	'../../src/ranges',
	'../../src/events',
	'../../src/colors',
	'./overlay',
	'./palette'
], function (
	arrays,
	dom,
	ranges,
	events,
	colors,
	Overlay,
	palette
) {
	'use strict';

	/**
	 * Whether or not the given string represents a color value.
	 *
	 * @param {String} value
	 * @return {Boolean}
	 */
	function isColor(value) {
		return value.substr(0, 1) === '#' || value.substr(0, 3) === 'rgb';
	}

	/**
	 * Generates swatches.
	 *
	 * @param {Object} swatches
	 * @param {Function(String)} getSwatchClass
	 * @return {Array<String>}
	 */
	function generateSwatches(swatches, getSwatchClass) {
		var list = swatches.map(function (color) {
			return (
				isColor(color)
					? '<div class="' + getSwatchClass(color) + '" '
						+ 'style="background-color: ' + color + '" '
						+ 'title="' + color + '"></div>'
					: '<div class="' + getSwatchClass(color) + ' '
						+ color + '"></div>'
			);
		});
		list.push(
			'<div class="removecolor" title="Remove Color">&#10006</div></td>'
		);
		return list;
	}

	/**
	 * Update the given range's text color based on the selected swatch element.
	 *
	 * @param {DOMObject} selected
	 * @param {Range} range
	 */
	function onSelect(selected, range) {
		if (range.collapsed) {
			ranges.extendToWord(range);
		}
		var swatch = selected.firstChild;
		if (dom.hasClass(swatch, 'removecolor')) {
			colors.unsetTextColor(range);
			colors.unsetBackgroundColor(range);
		} else {
			// colors.setTextColor(
			colors.setBackgroundColor(
				range,
				dom.getComputedStyle(swatch, 'background-color')
			);
		}
		ranges.select(range);
	}

	var rangeAtOpen;

	/**
	 * Gets/generates an overlay object for the given editable.
	 *
	 * @param {Array<String>} swatches
	 * @param {Function(String)} getSwatchClass
	 * @return {Overlay}
	 */
	function getOverlay(swatches, button, getSwatchClass) {
		var overlay = new Overlay(
			generateSwatches(swatches, getSwatchClass),
			function (selected) {
				if (rangeAtOpen) {
					onSelect(selected, rangeAtOpen);
				}
			},
			button
		);
		var elem = overlay.$element[0];
		dom.addClass(elem, 'ui-picker-overlay');
		elem.style.position = 'absolute';
		return overlay;
	}

	var getSwatchClass = (function (swatches) {
		var index = {};
		swatches.forEach(function (color, i) {
			index[colors.hex(color.toLowerCase())] = 'swatch' + i;
		});
		return function getSwatchClass(color) {
			return (
				index[color.toLowerCase()]
					||
				index[colors.hex(color.toLowerCase())]
			);
		};
	}(palette));

	var overlay;

	function click() {
		var selected = overlay.$element.find('.selected')[0];
		if (selected) {
			dom.removeClass(selected, 'selected');
		}

		var focused = overlay.$element.find('.focused')[0];
		if (focused) {
			dom.removeClass(focused, 'focused');
		}

		rangeAtOpen = ranges.get();

		if (rangeAtOpen) {
			var swatchClass = getSwatchClass(
				// colors.getTextColor(rangeAtOpen)
				colors.getBackgroundColor(rangeAtOpen)
			);
			if (swatchClass) {
				var td = overlay.$element.find('.' + swatchClass).closest('td')[0];
				if (td) {
					dom.addClass(td, 'focused');
					dom.addClass(td, 'selected');
				}
			}
		}

		var offset = Overlay.calculateOffset(this, 'absolute');
		offset.top += parseInt(dom.getComputedStyle(this, 'height'), 10);

		overlay.show(offset);
	}


	var button = document.createElement('button');
	button.appendChild(document.createTextNode('Change TextColor'));
	events.add(button, 'click', click);
	document.getElementsByTagName('body')[0].appendChild(button);

	overlay = getOverlay(palette, button, getSwatchClass);
});