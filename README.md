# Squarified treemap inspired by Flamegraph

* Реализуем squarified treemap 
* Заимствую логику из реализации flamegraph для того, чтобы выводить полное название области в нижней части svg-картинки
* В качестве примера использую размер файлов в файловой системе, как самый очевидный и полезный кейс (примеры внизу)
* Верхний уровень иерархии в treemap подкрашен категориальной палитрой из ColorBrewer2.


```python
from IPython.display import display, Image, SVG, HTML
from subprocess import check_output
```


```python
# build file sizes tree
import os
import shlex
import logging

def get_du_result(path):
    cmd = "du -shk " + shlex.quote(os.path.abspath(os.path.expanduser(path)))
    try:
        s = check_output(["bash", "-c", cmd])
        return int(s.decode("utf-8").split("\t")[0]) * 1024
    except:
        logging.debug(":( " + cmd)
        return 0

    
def list_dir_with_sizes(path):
    entries = os.listdir(os.path.expanduser(path))
    entries = [os.path.join(path, p) for p in entries]
    return [(p, get_du_result(p)) for p in entries]


def list_dir_with_sizes_recursive(path, alpha=0.01):
    entries = dict(list_dir_with_sizes(path))
    total_size = sum(size for name, size in entries.items())
    threshold = total_size * alpha
    
    def extend(m, key):
        if m[key] < threshold or not os.path.isdir(os.path.abspath(os.path.expanduser(key))):
            return
        m[key] = dict(list_dir_with_sizes(key))
        for k in list(m[key]):
            extend(m[key], k)
        
    for key in list(entries):
        extend(entries, key)
    
    return entries
```


```python
# Draw TreeMap
from lxml import etree
from math import log2
from random import randrange

class SquarifiedTreeMap(object):

    def __init__(self, tree, size, short_names={}, urls={}, url_target="", eps=0.001):
        self._tree = tree
        self._size = size
        self._short_names = short_names
        self._urls = {k: urls[k] for k, v in tree.items() if k in urls}  # only top level
        self._url_target = url_target
        self._eps = eps
        self._image_eps = 1
        js_colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']
        self._colors = [(int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)) for c in js_colors]
        self._colors = [tuple(((cp + 255) // 2 for cp in c)) for c in self._colors]
        self._i_color = 0
        
    def _next_color(self):
        c = "url(#radGrad%d)" % (self._i_color % len(self._colors))
        self._i_color += 1
        return c 
    
    @staticmethod
    def _svg_xml_to_string(etree_elem):
        return '<?xml version="1.0" encoding="utf-8" ?>\n' + \
            etree.tostring(etree_elem, pretty_print=True).decode("utf-8").replace("_AAsemicolon_", ":")

    @staticmethod
    def _svg_root_elem(width, height):
        return etree.Element('svg', attrib={
            "baseProfile": "full",
            "height": str(height),
            "width": str(width),
            "onload": "init(evt)", 
            "version": "1.1",
            "xmlns": "http://www.w3.org/2000/svg",
            "xmlns_AAsemicolon_ev": "http://www.w3.org/2001/xml-events",
            "xmlns_AAsemicolon_xlink": "http://www.w3.org/1999/xlink",
        })

    @staticmethod
    def _svg_rect_elem(p, color=(0, 0, 0), width=1, fill="none", 
                      visible=True, category=None):
        attrs = {
            "fill": fill, "x": str(p[0][0]), "y": str(p[0][1]), 
            "height": str(max(0, p[1][1] - p[0][1])), 
            "width": str(max(0, p[1][0] - p[0][0])), 
            "stroke": "rgb(%s)" % ",".join(map(str, color)),
            "stroke-width": str(width),
        }
        if not visible:
            attrs["visibility"] = "hidden"
        if category is not None:
            attrs["category"] = category
        return etree.Element('rect', attrib=attrs)

    @staticmethod
    def _svg_text_elem(pos, text, font=12, color=(0, 0, 0), elem_id=None):
        attrs = {
            "fill": "rgb(%s)" % ",".join(map(str, color)), 
            "text-anchor": "",
            "x": str(pos[0]), "y": str(pos[1]), 
            "font-size": str(font),
            "font-family": "Verdana,monospace",
        }
        if elem_id is not None:
            attrs["id"] = elem_id
        elem = etree.Element('text', attrib=attrs)
        elem.text = text
        return elem

    def _svg_eventful_rect_elem(self, p, color=(0, 0, 0), fill_color="url(#radGrad0)", text="", short_name=""):
        root = etree.Element("g", attrib={
            "class": "func_g", "onmouseover": "s(this)", "onmouseout": "c(this)"})
        title_elem = etree.Element("title")
        title_elem.text = text
        root.append(title_elem)
        rect_elem = etree.Element('rect', attrib={  
            "fill": fill_color,
            "x": str(p[0][0]), "y": str(p[0][1]), 
            "height": str(max(0, p[1][1] - p[0][1])), 
            "width": str(max(0, p[1][0] - p[0][0])), 
            "stroke": "rgb(%s)" % ",".join(map(str, color))
        })
        root.append(rect_elem)
        rect_selection_elem = etree.Element('rect', attrib={  
            "fill": "none", 
            "x": str(p[0][0] + 2), "y": str(p[0][1] + 2), 
            "height": str(max(0, p[1][1] - p[0][1] - 4)), 
            "width": str(max(0, p[1][0] - p[0][0] - 4)), 
            "stroke": "rgb(255, 0, 0)",
            "stroke-width": "2",
            "visibility": "hidden",
            "category": "select_frame",
        })
        root.append(rect_selection_elem)
        font = 12
        short_text = short_name if short_name else text
        max_len = int((p[1][0] - p[0][0]) / 7)
        if p[1][1] - p[0][1] > font and max_len > 3:
            if len(short_text) > max_len:
                short_text = short_text[:max_len - 3] + "..."
        else:
            short_text = ""        
        text_x = max(p[0][0] + 2, ((p[0][0] + p[1][0] - len(short_text) * 6 - 3) / 2))
        text_y = (p[0][1] + p[1][1]) / 2 + font * 0.3
        root.append(SquarifiedTreeMap._svg_text_elem((text_x, text_y), short_text, font=font))
        return root

    @staticmethod
    def _calc_max_ratio(mins, maxs, sums, w):
        h = sums / w
        assert mins > 0
        assert h > 0
        return max((h ** 2) / mins, maxs / (h ** 2))

    @staticmethod
    def _split_areas(sizes, base):
        i = 1
        mins = sizes[0]
        maxs = sizes[0]
        sums = sizes[0]
        max_ratio = SquarifiedTreeMap._calc_max_ratio(mins, maxs, sums, base)
        while i < len(sizes):
            assert sizes[i] > 0
            curs = sizes[i]
            nmins = min(mins, curs)
            nmaxs = max(maxs, curs)
            nsums = sums + curs
            nmax_ratio = SquarifiedTreeMap._calc_max_ratio(nmins, nmaxs, nsums, base)
            if nmax_ratio > max_ratio:
                break
            mins, maxs, sums, max_ratio, i = nmins, nmaxs, nsums, nmax_ratio, i + 1
        return sums / base, i


    @staticmethod
    def _human_readable_int(value, _suffixes = ["", 'K', 'M', 'G', 'T', "P"]):
        order = int(log2(value) / 10) if value else 0
        return '{:0.2f} {}'.format(value / (1 << (order * 10)), _suffixes[order])

    
    def _draw_one(self, name, tree, rect, color):
        if isinstance(tree, dict):
            root = etree.Element("g", attrib={
                "onmouseover": "s_outer(this)", "onmouseout": "c_outer(this)"})
            nrect = ((rect[0][0] + 1, rect[0][1] + 1), (rect[1][0] - 1, rect[1][1] - 1))
            nrect2 = ((rect[0][0] + 2, rect[0][1] + 2), (rect[1][0] - 2, rect[1][1] - 2))

            root.append(self._draw(tree, nrect, color))
            root.append(self._svg_rect_elem(rect, color=(0, 0, 0)))
            root.append(self._svg_rect_elem(
                nrect2, color=(255, 0, 0), width=2,
                visible=False, category="select_frame"))
        else:
            sfx = " (%s)" % self._human_readable_int(tree)
            root = self._svg_eventful_rect_elem(
                rect, text=name + sfx, fill_color=color,
                short_name=self._short_names.get(name, name))
        if name in self._urls:
            a_element = etree.Element('a', attrib={"href": self._urls[name], "target": self._url_target})
            a_element.append(root)
            root = a_element
        return root
    
    def _calc_area(self, tree):
        if isinstance(tree, (int, float)):
            return max(tree, self._eps)
        else:
            return max(sum(self._calc_area(subtree) for key, subtree in tree.items()), self._eps)

    def _draw(self, tree, rect, color):
        root = etree.Element('g')
        if len(tree) == 0:
            return root

        tree = list(sorted(tree.items(), key=lambda x: self._calc_area(x[1]), reverse=True))

        w = rect[1][0] - rect[0][0]
        h = rect[1][1] - rect[0][1]

        if w < self._image_eps or h < self._image_eps:
            return root

        areas = [self._calc_area(a) for n, a in tree]
        if min(areas) <= 0:
            print(tree)
        areas_k = w * h / sum(areas)
        areas = [a * areas_k for a in areas]

        if w < h:
            h0, sh = self._split_areas(areas, w)
            old_x = rect[0][0]
            for (n, subtree), a in zip(tree[:sh], areas):
                new_x = old_x + a / h0
                ar = ((old_x, rect[0][1]), (new_x, rect[0][1] + h0))
                old_x = new_x
                root.append(self._draw_one(n, subtree, ar, color or self._next_color()))
            root.append(self._draw(dict(tree[sh:]), ((rect[0][0], rect[0][1] + h0), rect[1]), color))
        else:
            w0, sh = self._split_areas(areas, h)
            old_y = rect[0][1]
            for (n, subtree), a in zip(tree[:sh], areas):
                new_y = old_y + a / w0
                ar = ((rect[0][0], old_y), (rect[0][0] + w0, new_y))
                old_y = new_y
                root.append(self._draw_one(n, subtree, ar, color or self._next_color()))
            root.append(self._draw(dict(tree[sh:]), ((rect[0][0] + w0, rect[0][1]), rect[1]), color))
        return root

    def draw_all(self, dest):
        size = self._size
        root = self._svg_root_elem(size[0], size[1])
        style_elem = etree.Element('style', attrib={"type": "text/css"})
        style_elem.text = ".func_g:hover { stroke:black; stroke-width:0.5; cursor:pointer; }"
        root.append(style_elem)

        script_elem = etree.Element('script', attrib={"type": "text/ecmascript"})
        script_elem.text = etree.CDATA(open('script.js').read())
        root.append(script_elem)

        defs_elem = etree.Element('defs')
        for i, c in enumerate(self._colors):
            radial_grad_elem = etree.Element('radialGradient', attrib={"id": "radGrad%d" % i})
            radial_grad_elem.append(etree.Element('stop', attrib={"offset": "0%", "stop-color": "rgb(255, 255, 255)"}))
            radial_grad_elem.append(etree.Element('stop', attrib={"offset": "100%", "stop-color": "rgb(%s)" % ", ".join(map(str, c))}))
            defs_elem.append(radial_grad_elem)
        root.append(defs_elem)

        bottom_line_elem = self._svg_text_elem((0, size[1] - 5), " ", font=12, elem_id="details")
        root.append(bottom_line_elem)

        map_size = (size[0], size[1] - 20)

        rect_element = self._svg_rect_elem(((0, 0), map_size), color=(235, 235, 0))
        root.append(rect_element)

        map_rect = ((3, 3), (map_size[0] - 3, map_size[1] - 3))
        root.append(self._draw(self._tree, map_rect, color=None))
        
        with open(dest, "w") as f:
            f.write(self._svg_xml_to_string(root))


def show_svg(svg_path):
    display(HTML('<object type="image/svg+xml" data="{path}"> </object>'.format(path=svg_path)))
        
def get_all_keys(d):
    if not isinstance(d, dict):
        return []
    r = list(d)
    for k, sd in d.items():
        r.extend(get_all_keys(sd))
    return r


def test_on_dir(path, svg_fname="tmp.svg"):
    dirs = list_dir_with_sizes_recursive(path)
    short_names = {d: os.path.basename(d) for d in get_all_keys(dirs)}
    SquarifiedTreeMap(dirs, (600, 500), short_names=short_names).draw_all(svg_fname)
    show_svg(svg_fname)
    
test_on_dir("~/Downloads", "./static/downloads.svg")
```


<object type="image/svg+xml" data="./static/downloads.svg"> </object>



```python
test_on_dir("~/", "./static/home.svg")
```


<object type="image/svg+xml" data="./static/home.svg"> </object>



```python
test_on_dir("..", "./static/parent.svg")
```


<object type="image/svg+xml" data="./static/parent.svg"> </object>



```python

```

# Еще больше интерактивности с помощью Flask


```python
import flask
import threading
import logging
import time
import functools
import sys
import os
import traceback
from IPython.display import display, HTML

from logging.config import dictConfig

dictConfig({
    'version': 1,
    'handlers': {
        'file.handler': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'test.log',
            'maxBytes': 4194304,  # 4 MB
            'backupCount': 10,
            'level': 'DEBUG',
        },
    },
    'loggers': {
        'werkzeug': {
            'level': 'DEBUG',
            'handlers': ['file.handler'],
        },
    },
})

port = 8999

# Create the webapp
app = flask.Flask(__name__)

        
def exception_verbose(f):
    @functools.wraps(f)
    def safe_f(*a, **b):
        try:
            return f(*a, **b)
        except Exception:
            extype, ex, tb = sys.exc_info()
            formatted = traceback.format_exception(extype, ex, tb)

            err_template = """
<!DOCTYPE html>
<html>
    <h1> ERROR </h1>
    <pre>
{err_text}
    </pre>
</html>
            """
            err = err_template.format(err_text="\n".join(formatted))
            return err, 500
    return safe_f
    

@app.route("/render/<path:subpath>")
@exception_verbose
def images(subpath):
    svg_fname = subpath.replace('/', '_').replace('~', "_HOME_") + str(randrange(100500000)) + '.svg'
    dirs = list_dir_with_sizes_recursive(subpath)
    short_names = {d: os.path.basename(d) for d in get_all_keys(dirs)}
    urls = {d: flask.url_for("browse", subpath=d) + "?" + flask.request.query_string.decode("utf-8")
            for d in dirs if os.path.isdir(os.path.abspath(os.path.expanduser(d)))}
    SquarifiedTreeMap(
        dirs, (600, 500), short_names=short_names, urls=urls, 
        url_target=flask.request.args.get('main_frame')
    ).draw_all("./static/" + svg_fname)
    return flask.redirect(flask.url_for('static', filename=svg_fname))


@app.route('/browse/<path:subpath>')
@exception_verbose
def browse(subpath):    
    path = os.path.abspath(os.path.expanduser(subpath))
    
    template = """<!DOCTYPE html>
    <html>
    <table width="100%">
    <tr>
    <td align="top" valign="top">
            <h4> Dir: {subpath} </h4>
            {refs}
    </td>
    <td align="right" valign="top">
        <object type="image/svg+xml" data="{img_url}?{query_params}"> </object>
    </td>
    </tr>
    </table>
    </html>
    """
    
    def sort_key(p):
        return (not os.path.isdir(os.path.join(path, p)), p.startswith('.'), p)
        
    parent_subpath = os.path.dirname(subpath) if subpath.find('/') != -1 else None
    query_params = flask.request.query_string.decode("utf-8")
    
    answer = template.format(subpath=subpath, query_params=query_params,
                             img_url=flask.url_for('images', subpath=subpath),
                             refs="\n".join(
        (
            [
                '<a href="/browse/{parent_subpath}?{query_params}"> .. </a> <br>'.format(
                    parent_subpath=parent_subpath, subpath=subpath, query_params=query_params)
            ] if parent_subpath else []
        ) + [
            ('<a href="/browse/{subpath}/{f}?{query_params}"> {f} </a> <br>'
             if os.path.isdir(os.path.join(path, f)) else
             '{f} <br>').format(subpath=subpath, f=f, query_params=query_params)
            for f in sorted(os.listdir(path), key=sort_key)
        ]
    ))
    return answer


@app.route('/iframe')
def main_frame():
    return '''
    <!DOCTYPE html">
    <html>
    <head>
        <iframe src="{url}?main_frame={main_frame}" name="{main_frame}" width="100%" height="100%" frameborder="no">
            Problems with iframe
        </iframe>
    </head>

    <body>
    </body>
    </html>
    '''.format(port=port, url=flask.url_for("browse", subpath="~"), 
               main_frame="mf_%d" % randrange(1e18))


@app.route('/')
def root():
    return flask.redirect(flask.url_for('browse', subpath="~"))

def post_info(app, port):
    time.sleep(1)
    display(HTML('''
        <iframe src="http://localhost:{port}/iframe" height="800" width="100%" align="left">
        Ваш браузер не поддерживает плавающие фреймы!
        </iframe>
    '''.format(port=port)))
        

info_thread = None
try:
    info_thread = threading.Thread(target=post_info, args=(app, port))
    info_thread.start()
    os.environ["WERKZEUG_RUN_MAIN"] = "true"
    app.run(port=port)
finally:
    if info_thread is not None:
        info_thread.join()
    
```

    INFO:werkzeug: * Running on http://127.0.0.1:8999/ (Press CTRL+C to quit)




<iframe src="http://localhost:8999/iframe" height="800" width="100%" align="left">
Ваш браузер не поддерживает плавающие фреймы!
</iframe>



    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:39] "GET /iframe HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:39] "GET /browse/~?main_frame=mf_434570665356545254 HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:40] "GET /render/~?main_frame=mf_434570665356545254 HTTP/1.1" 302 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:40] "GET /static/_HOME_89411507.svg HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:42] "GET /browse/~/VirtualBox%20VMs?main_frame=mf_434570665356545254 HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:42] "GET /render/~/VirtualBox%20VMs?main_frame=mf_434570665356545254 HTTP/1.1" 302 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:42] "GET /static/_HOME__VirtualBox%20VMs8335928.svg HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:44] "GET /browse/~?main_frame=mf_434570665356545254 HTTP/1.1" 200 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:45] "GET /render/~?main_frame=mf_434570665356545254 HTTP/1.1" 302 -
    INFO:werkzeug:127.0.0.1 - - [03/Nov/2019 14:39:45] "GET /static/_HOME_41327360.svg HTTP/1.1" 200 -



```python

```


```python

```


```python
!jupyter nbconvert tree_map_1.ipynb --to markdown --output README
```

    [NbConvertApp] Converting notebook tree_map_1.ipynb to markdown
    [NbConvertApp] Writing 17251 bytes to README.md



```python
!jupyter nbconvert tree_map_1.ipynb --to html --output index
```

    [NbConvertApp] Converting notebook tree_map_1.ipynb to html
    [NbConvertApp] Writing 351200 bytes to index.html



```python

```


```python

```


```python

```
