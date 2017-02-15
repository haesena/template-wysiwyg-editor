tinymce.PluginManager.add('page', function(editor, url) {
    var cssId;

    // Adds a menu item to the tools menu
    editor.addMenuItem('page', {
        text: 'Add new page',
        context: 'tools',
        onclick: function() {

        }
    });


    // when the editor is initialized, we add the css, and the mouse listeners
    editor.on('init', function() {
        var dom = editor.dom, linkElm;

        if (!cssId) {
            cssId = dom.uniqueId();
            linkElm = dom.create('link', {
                id: cssId,
                rel: 'stylesheet',
                href: url + '/css/page.css'
            });

            editor.getDoc().getElementsByTagName('head')[0].appendChild(linkElm);
        }
    });
});