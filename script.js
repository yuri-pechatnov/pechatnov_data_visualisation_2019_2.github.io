
var details;
function init(evt) {
    details = document.getElementById("details").firstChild;
}

// mouse-over for info
function s(node) { // show
    info = g_to_text(node);
    find_child_cat(node, "rect", "select_frame").setAttribute("visibility", "visible");

    details.nodeValue = "Rectangle: " + info;
}
function c(node) { // clear
    find_child_cat(node, "rect", "select_frame").setAttribute("visibility", "hidden");
    details.nodeValue = ' ';
}

// mouse-over for visible selection of outer frames
function s_outer(node) {
    find_child_cat(node, "rect", "select_frame").setAttribute("visibility", "visible");
}
function c_outer(node) {
    find_child_cat(node, "rect", "select_frame").setAttribute("visibility", "hidden");
}


function find_child(parent, name, attr) {
    var children = parent.childNodes;
    for (var i=0; i<children.length;i++) {
        if (children[i].tagName == name)
            return (attr != undefined) ? children[i].attributes[attr].value : children[i];
    }
    return;
}
function find_child_cat(parent, name, cat) {
    var children = parent.childNodes;
    for (var i=0; i<children.length;i++) {
        if (children[i].tagName == name && (cat == undefined || (children[i].attributes["category"] != undefined && children[i].attributes["category"].value == cat)))
            return children[i];
    }
    return;
}

function g_to_text(e) {
    var text = find_child(e, "title").firstChild.nodeValue;
    return (text)
}
