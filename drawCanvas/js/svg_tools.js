// http://stackoverflow.com/questions/14179333/convert-svg-path-to-relative-commands
function convertToRelative(path) {
    function set(type) {
        var args = [].slice.call(arguments, 1),
        rcmd = 'createSVGPathSeg'+ type +'Rel',
        rseg = path[rcmd].apply(path, args);

        segs.replaceItem(rseg, i);
    }
    var dx, dy, x0, y0, x1, y1, x2, y2, segs = path.pathSegList;
    for (var x = 0, y = 0, i = 0, len = segs.numberOfItems; i < len; i++) {
        var seg = segs.getItem(i), c   = seg.pathSegTypeAsLetter;
        if (/[MLHVCSQTAZz]/.test(c)) {
            if ('x1' in seg) x1 = seg.x1 - x;
            if ('x2' in seg) x2 = seg.x2 - x;
            if ('y1' in seg) y1 = seg.y1 - y;
            if ('y2' in seg) y2 = seg.y2 - y;
            if ('x'  in seg) dx = -x + (x = seg.x);
            if ('y'  in seg) dy = -y + (y = seg.y);
            switch (c) {
                case 'M': set('Moveto',dx,dy);                   break;
                case 'L': set('Lineto',dx,dy);                   break;
                case 'H': set('LinetoHorizontal',dx);            break;
                case 'V': set('LinetoVertical',dy);              break;
                case 'C': set('CurvetoCubic',dx,dy,x1,y1,x2,y2); break;
                case 'S': set('CurvetoCubicSmooth',dx,dy,x2,y2); break;
                case 'Q': set('CurvetoQuadratic',dx,dy,x1,y1);   break;
                case 'T': set('CurvetoQuadraticSmooth',dx,dy);   break;
                case 'A': set('Arc',dx,dy,seg.r1,seg.r2,seg.angle,
                              seg.largeArcFlag,seg.sweepFlag);   break;
                case 'Z': case 'z': x = x0; y = y0; break;
            }
        }
        else {
            if ('x' in seg) x += seg.x;
            if ('y' in seg) y += seg.y;
        }
        // store the start of a subpath
        if (c == 'M' || c == 'm') {
            x0 = x;
            y0 = y;
        }
    }
    path.setAttribute('d', path.getAttribute('d').replace(/Z/g, 'z'));
}

//--------------------

var svg_spiral = "m 334.28571,69.50504 c 0,0 -160,20 -134.28571,105.71429 25.71429,85.71428 65.71429,120 142.85714,114.28571 C 420,283.79075 448.57143,215.21933 440,160.93361 c -8.57143,-54.28571 -34.28571,-45.71428 -85.71429,-45.71428 -51.42857,0 -117.14285,48.57142 -65.71428,94.28571 C 340,255.21933 397.14286,195.21933 397.14286,195.21933 l -68.57143,-25.71429";

var split_svg_spiral = [];
_.each(svg_spiral.split(','), function(s){
    split_svg_spiral = split_svg_spiral.concat(s.split(' '));
});

var svg_commands = [];
var svg_index = 0;
while (svg_index < split_svg_spiral.length) {
    var s = split_svg_spiral[svg_index];
    console.log(s);

    if (isNaN(Number(s))){
        // if it's not a number, assume it's a command
        svg_commands.push({'type': s});
        svg_index++;
    } else {
        // the number assignment depends on the command.
    }
    svg_index++;
}
