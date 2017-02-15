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

tinymce.PluginManager.add('absolute_div', function(editor, url) {
    var cssId;
    
    var initiated = false, dragging = false;
    var start_x = 0, start_y = 0, end_x = 0, end_y = 0, offset_top = 0, offset_left = 0;
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

        editor.on('insertAbsDiv', function() {
            self.active(initiated);
            editor.dom.toggleClass(editor.getBody(), 'mce-cd-absdiv');
        });
    }

    function setSelectedDiv(node) {

        if(selectedAbsDiv != null) {
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

        var rx = divs[selectedAbsDiv].end.x - 3;
        var ry = divs[selectedAbsDiv].end.y - 3;

        var mx = divs[selectedAbsDiv].start.x - 3;
        var my = divs[selectedAbsDiv].start.y - 3;

        var rOptions = {
            class: 'absolute_div_resize',
            // style: 'top: ' + ry + 'px; left: ' + rx + 'px;'
        };

        var mOptions = {
            class: 'absolute_div_move',
            // style: 'top: ' + my + 'px; left: ' + mx + 'px;'
        };

        rDiv = editor.dom.add(node.id, 'div', rOptions, '', false);
        mDiv = editor.dom.add(node.id, 'div', mOptions, '', false);

    }

    // add the button to the editor
    editor.addButton('absolute_div', {
        title: 'Insert Block',
        cmd: 'absoluteDiv',
        image: url+'/textblock.png',
        onPostRender: toggleActiveState
    });

    // when the button is clicked, we toggle the initiaded-flag and update the state of the button
    editor.addCommand('absoluteDiv', function() {
        console.log("in cmd");
        initiated = !initiated;
        editor.fire('insertAbsDiv');
    });

    // when the editor is initialized, we add the css, and the mouse listeners
    editor.on('init', function() {
        var dom = editor.dom, linkElm;

        if (!cssId) {
            cssId = dom.uniqueId();
            linkElm = dom.create('link', {
                id: cssId,
                rel: 'stylesheet',
                href: url + '/css/absolute_div.css'
            });

            editor.getDoc().getElementsByTagName('head')[0].appendChild(linkElm);
        }

        // select all divs with the absolute_div-class
        var init_divs = dom.select("div.absolute_div");

        // each initial div will be inserted in the divs-array for resizing and moving capabilities
        for(var i = 0; i < init_divs.length; i++) {
            var d = init_divs[i];

            // retrieve id, generate new one if not set
            var did = d.id;
            if(did == null) {
                did = dom.uniqueId();
                d.id = did;
            }

            // parse the absolute position
            var t = parseInt(d.style.top.replace("px", ""));
            var l = parseInt(d.style.left.replace("px", ""));
            var w = parseInt(d.style.width.replace("px", ""));
            var h = parseInt(d.style.height.replace("px", ""));

            divs[did] = {
                div: did,
                start: {
                    x: l,
                    y: t
                },
                end: {
                    x: l+w,
                    y: t+h
                }
            };
        }


        editor.on("mouseDown", function(e) {

            // if the user clicked the "new div" button
            if(initiated) {

                // save the target element of the mousedown event
                target = e.target;

                offset_left = target.offsetLeft;
                offset_top = target.offsetTop;

                console.log("target: "+target.id+", offset: "+offset_top+", "+offset_left);

                // save the position of the mousedown event
                start_x = e.x - offset_left;
                start_y = e.y - offset_top;

                console.log(target);

                dragging = true;

            // if the user clicked on the resizing-div
            } else if(e.target == rDiv) {

                console.log("resize-div clicked");

                // activate the resizing mode
                resizing = true;
                return false;

            // if the user clicked the moving-div
            } else if(e.target == mDiv) {

                console.log("move-div clicked");

                // activate the moving-mode
                moving = true;
                return false;

            }
        });

        editor.on("mouseMove", function(e) {

            // if we are in the dragging-mode
            if(dragging == true) {

                // position of the mouse
                var m_x = e.x - offset_left;
                var m_y = e.y - offset_top;

                var h = m_y - start_y;
                var w = m_x - start_x;

                if(draggingDivId == null) {

                    draggingDivId = dom.uniqueId();

                    var options = {
                        id: draggingDivId,
                        style: 'position: absolute; top: '+start_y+'px; left: '+start_x+'px; height: '+h+'px; width: '+w+'px;',
                        class: 'absolute_div'
                    };

                    editor.dom.add(target, 'div', options, '', false);
                } else {
                    editor.dom.setStyle(draggingDivId, 'height', h);
                    editor.dom.setStyle(draggingDivId, 'width', w);
                }

            } else if (resizing == true) {

                var sx = divs[selectedAbsDiv].start.x;
                var sy = divs[selectedAbsDiv].start.y;

                var m_x = e.x - offset_left;
                var m_y = e.y - offset_top;

                var h = Math.abs(sy - m_y);
                var w = Math.abs(sx - m_x);

                editor.dom.setStyle(selectedAbsDiv, 'height', h);
                editor.dom.setStyle(selectedAbsDiv, 'width', w);

            } else if (moving == true) {

                var osx = divs[selectedAbsDiv].start.x;
                var osy = divs[selectedAbsDiv].start.y;

                var m_x = e.x - offset_left;
                var m_y = e.y - offset_top;

                editor.dom.setStyle(selectedAbsDiv, 'top', m_y);
                editor.dom.setStyle(selectedAbsDiv, 'left', m_x);

            }
        });

        editor.on("mouseUp", function(e) {

            // if the user was creating a new absolute div, insert it now
            if(dragging == true) {

                end_x = e.x - offset_left;
                end_y = e.y - offset_top;

                initiated = false;
                dragging = false;

                editor.dom.remove(draggingDivId);
                draggingDivId = null;

                var h = Math.abs(start_y - end_y);
                var w = Math.abs(start_x - end_x);

                var newId = dom.uniqueId();

                var options = {
                    id: newId,
                    class: 'absolute_div',
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

                editor.fire('insertAbsDiv');

            } else if (resizing == true) {

                divs[selectedAbsDiv].end.x = e.x - offset_left;
                divs[selectedAbsDiv].end.y = e.y - offset_top;

                resizing = false;

            } else if (moving == true) {

                var osx = divs[selectedAbsDiv].start.x;
                var osy = divs[selectedAbsDiv].start.y;
                var oex = divs[selectedAbsDiv].end.x;
                var oey = divs[selectedAbsDiv].end.y;

                var diff_x = osx - e.x - offset_left;
                var diff_y = osy - e.y - offset_top;

                divs[selectedAbsDiv].start.x = e.x - offset_left;
                divs[selectedAbsDiv].start.y = e.y - offset_top;

                divs[selectedAbsDiv].end.x = oex - diff_x;
                divs[selectedAbsDiv].end.y = oey - diff_y;

                moving = false;

            } else {

                var node = editor.selection.getNode();

                // if we clicked on an absolute div
                if(editor.dom.hasClass(node.id, 'absolute_div')) {
                    setSelectedDiv(node);
                } else {

                    // check if we clicked on an element that is inside an absolute div
                    var nodes = editor.dom.getParents(node, function(n) {
                        if(editor.dom.hasClass(n, 'absolute_div'))
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
