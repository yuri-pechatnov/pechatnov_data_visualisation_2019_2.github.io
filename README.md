# Squarified treemap inspired by Flamegraph

* Реализуем squarified treemap 
* Заимствую логику из реализации flamegraph для того, чтобы выводить полное название области в нижней части svg-картинки
* В качестве примера исползую размер файлов в файловой системе, как самый очевидный и полезный кейс (примеры внизу)



```python
from IPython.display import display, Image, SVG, HTML
```


```python
from subprocess import check_output
```


```python

```


```python
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

display(list_dir_with_sizes_recursive("~"))
display(list_dir_with_sizes_recursive("/Users/pechatnov/VirtualBox VMs/"))

```


    {'~/.config': 11132928,
     '~/Music': 0,
     '~/datavis': 10113024,
     '~/.DS_Store': 16384,
     '~/VirtualBox VMs': {'~/VirtualBox VMs/.DS_Store': 8192,
      '~/VirtualBox VMs/Ubuntu': {'~/VirtualBox VMs/Ubuntu/Ubuntu.vbox-prev': 8192,
       '~/VirtualBox VMs/Ubuntu/Snapshots': 0,
       '~/VirtualBox VMs/Ubuntu/Ubuntu.vdi': 22776119296,
       '~/VirtualBox VMs/Ubuntu/Logs': 786432,
       '~/VirtualBox VMs/Ubuntu/Ubuntu.vbox': 8192}},
     '~/.CFUserTextEncoding': 4096,
     '~/Yandex.Disk.localized': 491520,
     '~/.local': 69632,
     '~/training': 12288,
     '~/Pictures': 0,
     '~/jup': 8192,
     '~/.ipython': 4263936,
     '~/Desktop': 8192,
     '~/Library': 0,
     '~/.matplotlib': 110592,
     '~/.cups': 4096,
     '~/Public': 0,
     '~/.yandex': 8192,
     '~/.ssh': 12288,
     '~/Movies': 0,
     '~/.Trash': {'~/.Trash/geany': 16384,
      '~/.Trash/Ubuntu.zip': 8288980992,
      '~/.Trash/.DS_Store': 12288,
      '~/.Trash/IMG_5280.JPG': 2555904,
      '~/.Trash/all': 8192,
      '~/.Trash/best': 0,
      '~/.Trash/IMG_5304.JPG': 2023424,
      '~/.Trash/Karabiner-Elements-12.7.0.dmg': 9502720,
      '~/.Trash/geany.zip': 12288,
      '~/.Trash/osxfuse-3.10.3.dmg': 7217152,
      '~/.Trash/IMG_5303.JPG': 2289664,
      '~/.Trash/IMG_5249.JPG': 2473984,
      '~/.Trash/sshfs-2.5.0.pkg': 3743744,
      '~/.Trash/virtualbox-6-0-8-build-130520.dmg': 151584768},
     '~/.ipynb_checkpoints': 0,
     '~/.jupyter': 8192,
     '~/Documents': 77824,
     '~/.bash_profile': 4096,
     '~/Downloads': {'~/Downloads/map.osm': 602112,
      '~/Downloads/iTerm2-3_3_4.zip': 13647872,
      '~/Downloads/0610MOWTLV_PECHATNOV_IURII.pdf': 40960,
      '~/Downloads/001.jpg': 133439488,
      '~/Downloads/fgraph.svg': 1744896,
      '~/Downloads/Booking.com_ Подтверждение_Тель_.pdf': 327680,
      '~/Downloads/490A7368.jpeg.jpg': 131072,
      '~/Downloads/.DS_Store': 12288,
      '~/Downloads/АВИАБИЛЕТ_PECHATNOV_IURII_TuristService_6733778.pdf': 36864,
      '~/Downloads/OSXFUSE-2.5.4.dmg': 6205440,
      '~/Downloads/0610MOWTLV_VRUCHTEL_SERAFIMA.pdf': 40960,
      '~/Downloads/policy.pdf': 262144,
      '~/Downloads/001.jpg.zip': 134348800,
      '~/Downloads/.localized': 0,
      '~/Downloads/001.jpg-1': 133439488,
      '~/Downloads/all.png': 507904,
      '~/Downloads/photo_2019-10-11 19.52.42.jpeg': 69632,
      '~/Downloads/1-19-1.jpg': 327680,
      '~/Downloads/490A7364.jpeg.jpg': 196608,
      '~/Downloads/Booking_com__Подтверждение_Иерусалим_ru.pdf': 262144,
      '~/Downloads/001-1.jpg': 327680,
      '~/Downloads/1-20-1.jpg': 262144,
      '~/Downloads/.bash_profile.uu 2.cpgz': 4096,
      '~/Downloads/geany-1.31_osx.dmg': 22298624,
      '~/Downloads/Подтверждение_Эйлат_en.pdf': 196608,
      '~/Downloads/TelegramMac.dmg': 30457856,
      '~/Downloads/Booking.com_ Иерусалим_Чек.pdf': 131072,
      '~/Downloads/YandexDisk30.dmg': 17874944,
      '~/Downloads/haifa_rus.pdf': 327680,
      '~/Downloads/490A7526.jpeg.jpg': 327680,
      '~/Downloads/1-88.jpg': 4096,
      '~/Downloads/1-98.jpg': 7364608,
      '~/Downloads/001.jpg-1.zip': 134348800,
      '~/Downloads/Booking.com_ Тель_Авив_Чек.pdf': 131072,
      '~/Downloads/001.jpg-2.zip': 134348800,
      '~/Downloads/001.jpg-2': 133439488,
      '~/Downloads/.bash_profile.uu.cpgz': 4096,
      '~/Downloads/photo_2019-10-11 19.52.41.jpeg': 69632,
      '~/Downloads/.bash_profile.uu': 4096,
      '~/Downloads/[Ioannis_G._Tollis,_Giuseppe_Di_Battista,_Peter_Ea(BookFi).pdf': 10506240,
      '~/Downloads/Подтверждение_Эйлат_ru.pdf': 196608,
      '~/Downloads/2019.10 Дайвинг в Эйлате': 235941888,
      '~/Downloads/iTerm.app': 37842944,
      '~/Downloads/XnViewMP-mac.dmg': 43024384,
      '~/Downloads/citytravel-2708100-6250342.pdf': 327680,
      '~/Downloads/stm.pdf': 471040,
      '~/Downloads/Booking.com_ Подтверждение_Иерусалим_h.pdf': 196608,
      '~/Downloads/citytravel-2708100-6250343.pdf': 327680,
      '~/Downloads/jm_tra-3sUmvkixf7Y.zip': 252608512,
      '~/Downloads/1.jpg': 4096,
      '~/Downloads/citytravel-2708100-6250340.pdf': 655360},
     '~/.python_history': 4096,
     '~/.gitconfig': 4096,
     '~/.bash_history': 4096,
     '~/.gtk-bookmarks': 4096,
     '~/.account': 73728}



    {'/Users/pechatnov/VirtualBox VMs/.DS_Store': 8192,
     '/Users/pechatnov/VirtualBox VMs/Ubuntu': {'/Users/pechatnov/VirtualBox VMs/Ubuntu/Ubuntu.vbox-prev': 8192,
      '/Users/pechatnov/VirtualBox VMs/Ubuntu/Snapshots': 0,
      '/Users/pechatnov/VirtualBox VMs/Ubuntu/Ubuntu.vdi': 22776119296,
      '/Users/pechatnov/VirtualBox VMs/Ubuntu/Logs': 786432,
      '/Users/pechatnov/VirtualBox VMs/Ubuntu/Ubuntu.vbox': 8192}}



```python
from lxml import etree
from math import log2

class SquarifiedTreeMap(object):

    def __init__(self, tree, size, short_names={}, eps=0.001):
        self._tree = tree
        self._size = size
        self._short_names = short_names
        self._eps = eps
    
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
            "height": str(p[1][1] - p[0][1]), 
            "width": str(p[1][0] - p[0][0]), 
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

    @staticmethod
    def _svg_eventful_rect_elem(p, color=(0, 0, 0), text="", short_name=""):
        root = etree.Element("g", attrib={
            "class": "func_g", "onmouseover": "s(this)", "onmouseout": "c(this)"})
        title_elem = etree.Element("title")
        title_elem.text = text
        root.append(title_elem)
        rect_elem = etree.Element('rect', attrib={  
            "fill": "url(#radGrad)",
            "x": str(p[0][0]), "y": str(p[0][1]), 
            "height": str(p[1][1] - p[0][1]), 
            "width": str(p[1][0] - p[0][0]), 
            "stroke": "rgb(%s)" % ",".join(map(str, color))
        })
        root.append(rect_elem)
        rect_selection_elem = etree.Element('rect', attrib={  
            "fill": "none", 
            "x": str(p[0][0] + 2), "y": str(p[0][1] + 2), 
            "height": str(p[1][1] - p[0][1] - 4), 
            "width": str(p[1][0] - p[0][0] - 4), 
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

    
    def _draw_one(self, name, tree, rect):
        if isinstance(tree, dict):
            root = etree.Element("g", attrib={
                "onmouseover": "s_outer(this)", "onmouseout": "c_outer(this)"})
            nrect = ((rect[0][0] + 1, rect[0][1] + 1), (rect[1][0] - 1, rect[1][1] - 1))
            nrect2 = ((rect[0][0] + 2, rect[0][1] + 2), (rect[1][0] - 2, rect[1][1] - 2))

            root.append(self._draw(tree, nrect))
            root.append(self._svg_rect_elem(rect, color=(0, 0, 0)))
            root.append(self._svg_rect_elem(nrect2, color=(255, 0, 0), width=2,
                                      visible=False,
                                      category="select_frame"))
            return root
        else:
            sfx = " (%s)" % self._human_readable_int(tree)
            return self._svg_eventful_rect_elem(rect, text=name + sfx,
                                          short_name=self._short_names.get(name, name))
    
    def _calc_area(self, tree):
        if isinstance(tree, (int, float)):
            return max(tree, self._eps)
        else:
            return max(sum(self._calc_area(subtree) for key, subtree in tree.items()), self._eps)

    def _draw(self, tree, rect):
        root = etree.Element('g')
        if len(tree) == 0:
            return root

        tree = list(sorted(tree.items(), key=lambda x: self._calc_area(x[1]), reverse=True))

        w = rect[1][0] - rect[0][0]
        h = rect[1][1] - rect[0][1]

        if w < self._eps or h < self._eps:
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
                root.append(self._draw_one(n, subtree, ar))
            root.append(self._draw(dict(tree[sh:]), ((rect[0][0], rect[0][1] + h0), rect[1])))
        else:
            w0, sh = self._split_areas(areas, h)
            old_y = rect[0][1]
            for (n, subtree), a in zip(tree[:sh], areas):
                new_y = old_y + a / w0
                ar = ((rect[0][0], old_y), (rect[0][0] + w0, new_y))
                old_y = new_y
                root.append(self._draw_one(n, subtree, ar))
            root.append(self._draw(dict(tree[sh:]), ((rect[0][0] + w0, rect[0][1]), rect[1])))
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
        radial_grad_elem = etree.Element('radialGradient', attrib={"id": "radGrad"})
        radial_grad_elem.append(etree.Element('stop', attrib={"offset": "0%", "stop-color": "rgb(255, 230, 230)"}))
        radial_grad_elem.append(etree.Element('stop', attrib={"offset": "100%", "stop-color": "rgb(255, 255, 255)"}))
        defs_elem.append(radial_grad_elem)
        root.append(defs_elem)

        bottom_line_elem = self._svg_text_elem((0, size[1] - 5), " ", font=12, elem_id="details")
        root.append(bottom_line_elem)

        map_size = (size[0], size[1] - 20)

        rect_element = self._svg_rect_elem(((0, 0), map_size), color=(235, 235, 0))
        root.append(rect_element)

        map_rect = ((3, 3), (map_size[0] - 3, map_size[1] - 3))
        root.append(self._draw(self._tree, map_rect))

        with open(dest, "w") as f:
            f.write(self._svg_xml_to_string(root))


def show_svg(svg_path):
    display(HTML('<object type="image/svg+xml" data="{path}"/>'.format(path=svg_path)))
        
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
    
test_on_dir("~/Downloads", "./downloads.svg")
```


<object type="image/svg+xml" data="./downloads.svg"/>



```python
test_on_dir("~/", "./home.svg")
```


<object type="image/svg+xml" data="./home.svg"/>



```python
test_on_dir("..", "./parent.svg")
```


<object type="image/svg+xml" data="./parent.svg"/>



```python
!jupyter nbconvert tree_map_1.ipynb --to markdown --output README
```

    [NbConvertApp] Converting notebook tree_map_1.ipynb to markdown
    [NbConvertApp] Writing 16345 bytes to README.md



```python

```
