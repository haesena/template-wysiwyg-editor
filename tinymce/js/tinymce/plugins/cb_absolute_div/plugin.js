/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('cb_absolute_div', function(editor, url) {
    var cssId;
    
    var initiated = false, dragging = false;
    var start_x = 0, start_y = 0, end_x = 0, end_y = 0;
    var target = null;

    // Temporary div which is shown while dragging (at insertion and resizing)
    var draggingDivId = null;

    // Id of the selected div, for moving and sizing
    var selectedAbsDiv = null;
    var moving = false, resizing = false;
    var rDiv = null, mDiv = null;

    // Array of the absolute positioned divs
    var divs = {};

    // We don't support older browsers like IE6/7 and they don't provide prototypes for DOM objects
    if (!window.NodeList) {
        return;
    }

    // toggle the active state of the button
    function toggleActiveState() {
        var self = this;

        self.active(initiated);

        editor.on('cInsertAbsDiv', function() {
            self.active(initiated);
            editor.dom.toggleClass(editor.getBody(), 'mce-cd-absdiv');
        });
    }

    function setSelectedDiv(node) {

        if(selectedAbsDiv != null) {
            editor.dom.removeClass(selectedAbsDiv, 'cb_selected');
            editor.dom.remove(rDiv);
            editor.dom.remove(mDiv);

            rDiv = null;
            mDiv = null;
        }

        if(node == null) {
            selectedAbsDiv = null;
            return;
        }

        selectedAbsDiv = node.id;
        editor.dom.addClass(selectedAbsDiv, 'cb_selected');

        var rx = divs[selectedAbsDiv].end.x - 3;
        var ry = divs[selectedAbsDiv].end.y - 3;

        var mx = divs[selectedAbsDiv].start.x - 3;
        var my = divs[selectedAbsDiv].start.y - 3;

        var rOptions = {
            class: 'cb_absolute_div_resize',
            style: 'top: ' + ry + 'px; left: ' + rx + 'px;'
        };

        var mOptions = {
            class: 'cb_absolute_div_move',
            style: 'top: ' + my + 'px; left: ' + mx + 'px;'
        };

        rDiv = editor.dom.add(tinymce.activeEditor.getBody(), 'div', rOptions, '', false);
        mDiv = editor.dom.add(tinymce.activeEditor.getBody(), 'div', mOptions, '', false);

    }

    // add the button to the editor
    editor.addButton('cb_absolute_div', {
        title: 'Insert Block',
        cmd: 'cbAbsoluteDiv',
        image: url+'/textblock.png',
        onPostRender: toggleActiveState
    });

    // when the button is clicked, we toggle the initiaded-flag and update the state of the button
    editor.addCommand('cbAbsoluteDiv', function() {
        initiated = !initiated;
        editor.fire('cInsertAbsDiv');
    });

    // when the editor is initialized, we add the css, and the mouse listeners
    editor.on('init', function() {
        var dom = editor.dom, linkElm;

        if (!cssId) {
            cssId = dom.uniqueId();
            linkElm = dom.create('link', {
                id: cssId,
                rel: 'stylesheet',
                href: url + '/css/cb_absolute_div.css'
            });

            editor.getDoc().getElementsByTagName('head')[0].appendChild(linkElm);
        }


        editor.on("mouseDown", function(e) {

            // if the user clicked the "new div" button
            if(initiated) {
                // save the position of the mousedown event
                start_x = e.x;
                start_y = e.y;

                // save the target element of the mousedown event
                target = e.target;

                dragging = true;

            // if the user clicked on the resizing-div
            } else if(e.target == rDiv) {

                // activate the resizing mode
                resizing = true;
                return false;

            // if the user clicked the moving-div
            } else if(e.target == mDiv) {

                // activate the moving-mode
                moving = true;
                return false;

            }
        });

        editor.on("mouseMove", function(e) {

            // if we are in the dragging-mode
            if(dragging == true) {

                // position of the mouse
                var m_x = e.x;
                var m_y = e.y;

                var h = m_y - start_y;
                var w = m_x - start_x;

                if(draggingDivId == null) {

                    draggingDivId = dom.uniqueId();

                    var options = {
                        id: draggingDivId,
                        style: 'position: absolute; top: '+start_y+'px; left: '+start_x+'px; height: '+h+'px; width: '+w+'px;',
                        class: 'cb_absolute_div'
                    };

                    editor.dom.add(target, 'div', options, '', false);
                } else {
                    editor.dom.setStyle(draggingDivId, 'height', h);
                    editor.dom.setStyle(draggingDivId, 'width', w);
                }

            } else if (resizing == true) {

                var sx = divs[selectedAbsDiv].start.x;
                var sy = divs[selectedAbsDiv].start.y;

                var m_x = e.x;
                var m_y = e.y;

                var h = Math.abs(sy - m_y);
                var w = Math.abs(sx - m_x);

                editor.dom.setStyle(selectedAbsDiv, 'height', h);
                editor.dom.setStyle(selectedAbsDiv, 'width', w);

                editor.dom.setStyle(rDiv, 'left', m_x - 3);
                editor.dom.setStyle(rDiv, 'top', m_y - 3);

            } else if (moving == true) {

                var osx = divs[selectedAbsDiv].start.x;
                var osy = divs[selectedAbsDiv].start.y;

                var ex = divs[selectedAbsDiv].end.x;
                var ey = divs[selectedAbsDiv].end.y;

                var m_x = e.x;
                var m_y = e.y;

                var diff_x = osx - m_x;
                var diff_y = osy - m_y;

                editor.dom.setStyle(selectedAbsDiv, 'top', m_y);
                editor.dom.setStyle(selectedAbsDiv, 'left', m_x);

                editor.dom.setStyle(mDiv, 'left', m_x - 3);
                editor.dom.setStyle(mDiv, 'top', m_y - 3);

                editor.dom.setStyle(rDiv, 'left', ex - diff_x - 3);
                editor.dom.setStyle(rDiv, 'top', ey - diff_y - 3);

            }
        });

        editor.on("mouseUp", function(e) {

            // if the user was creating a new absolute div, insert it now
            if(dragging == true) {

                end_x = e.x;
                end_y = e.y;

                initiated = false;
                dragging = false;

                editor.dom.remove(draggingDivId);
                draggingDivId = null;

                var h = Math.abs(start_y - end_y);
                var w = Math.abs(start_x - end_x);

                var newId = dom.uniqueId();

                var options = {
                    id: newId,
                    class: 'cb_absolute_div',
                    style: 'position: absolute; top: ' + start_y + 'px; left: ' + start_x + 'px; height: ' + h + 'px; width: ' + w + 'px;'
                };

                var newDiv = editor.dom.add(target, 'div', options, '', false);

                divs[newId] = {
                    div: newDiv,
                    start: {
                        x: start_x,
                        y: start_y
                    },
                    end: {
                        x: end_x,
                        y: end_y
                    }
                };

                selectedAbsDiv = newId;

                editor.selection.setCursorLocation(newDiv);

                setSelectedDiv(newDiv);

                editor.fire('cInsertAbsDiv');

            } else if (resizing == true) {

                divs[selectedAbsDiv].end.x = e.x;
                divs[selectedAbsDiv].end.y = e.y;

                resizing = false;

            } else if (moving == true) {

                var osx = divs[selectedAbsDiv].start.x;
                var osy = divs[selectedAbsDiv].start.y;
                var oex = divs[selectedAbsDiv].end.x;
                var oey = divs[selectedAbsDiv].end.y;

                var diff_x = osx - e.x;
                var diff_y = osy - e.y;

                divs[selectedAbsDiv].start.x = e.x;
                divs[selectedAbsDiv].start.y = e.y;

                divs[selectedAbsDiv].end.x = oex - diff_x;
                divs[selectedAbsDiv].end.y = oey - diff_y;

                moving = false;

            } else {

                var node = editor.selection.getNode();

                // if we clicked on an absolute div
                if(editor.dom.hasClass(node.id, 'cb_absolute_div')) {
                    setSelectedDiv(node);
                } else {

                    // check if we clicked on an element that is inside an absolute div
                    var nodes = editor.dom.getParents(node, function(n) {
                        if(editor.dom.hasClass(n, 'cb_absolute_div'))
                            return true;
                        return false;
                    });

                    if(nodes.length > 0) {
                        // if the clicked node is in an absolute div, mark it as selected
                        setSelectedDiv(nodes.shift());
                    } else {
                        // else, deselct the current selected div
                        setSelectedDiv(null);
                    }
                }
            }



        });
    });

    editor.on('remove', function() {
        // editor.dom.removeClass(editor.getBody(), 'mce-visualblocks');
    });
});
