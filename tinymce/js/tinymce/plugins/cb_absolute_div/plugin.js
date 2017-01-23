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
    
    // Array of the absolute positioned divs
    var divs = [];

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

        // alert('test');
        // console.log(editor);

        editor.on("mouseDown", function(e) {

            // if we clicked the "new div" button
            if(initiated) {
                // position of the mousedown event
                start_x = e.x;
                start_y = e.y;

                // target element of the mousedown event
                target = e.target;

                dragging = true;
            }

            // else we check if we clicked to resize a div
            for(var i = 0; i < divs.length; i++) {
                var div = divs[i];
                console.log(div);
            }
        });

        editor.on("mouseMove", function(e) {
            if(dragging == true) {

                var m_x = e.x;
                var m_y = e.y;

                var h = Math.abs(start_y - m_y);
                var w = Math.abs(start_x - m_x);

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
            }
        });

        editor.on("mouseUp", function(e) {
            if(dragging == false)
                return;

            end_x = e.x;
            end_y = e.y;

            initiated = false;
            dragging = false;

            editor.dom.remove(draggingDivId);
            draggingDivId = null;

            var h = Math.abs(start_y - end_y);
            var w = Math.abs(start_x - end_x);

            var options = {
                class: 'cb_absolute_div',
                style: 'position: absolute; top: '+start_y+'px; left: '+start_x+'px; height: '+h+'px; width: '+w+'px;'
            };

            var newDiv = editor.dom.add(target, 'div', options, 'new div', false);

            divs.push({
                div: newDiv,
                start: {
                    x: start_x,
                    y: start_y
                },
                end: {
                    x: end_x,
                    y: end_y
                }
            });

            editor.fire('cInsertAbsDiv');

        });
    });

    editor.on('remove', function() {
        // editor.dom.removeClass(editor.getBody(), 'mce-visualblocks');
    });
});
