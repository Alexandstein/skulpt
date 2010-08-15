var interned = {};

/**
 * @constructor
 * @param {*} x
 * @param {bool=} $ctorhack
 * @extends Sk.builtin.object
 */
Sk.builtin.str = function(x, $ctorhack)
{
    if ($ctorhack) return this;
    if (x === undefined) throw "error: trying to str() undefined (should be at least null)";
    if (x instanceof Sk.builtin.str && x !== Sk.builtin.str.prototype.ob$type) return x;
    if (!(this instanceof Sk.builtin.str)) return new Sk.builtin.str(x);

    // convert to js string
    var ret;
    if (x === true) ret = "True";
    else if (x === false) ret = "False";
    else if (x === null) ret = "None";
    else if (typeof x === "number")
        ret = x.toString();
    else if (typeof x === "string")
        ret = x;
    else if (x.tp$str !== undefined)
    {
        ret = x.tp$str();
        if (!(ret instanceof Sk.builtin.str)) throw new Sk.builtin.ValueError("__str__ didn't return a str");
        return ret;
    }
    else
        return Sk.misceval.objectRepr(x);

    // interning required for strings in py
    var it = interned[ret];
    if (it !== undefined) return it;

    this.__class__ = this.nativeclass$ = Sk.builtin.str;
    this.v = ret;
    interned[ret] = this;
    return this;

}

Sk.builtin.str.prototype.mp$subscript = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("string index out of range");
        return new Sk.builtin.str(this.v.charAt(index));
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = '';
        index.sssiter$(this, function(i, wrt) {
                if (i >= 0 && i < wrt.v.length)
                    ret += wrt.v.charAt(i);
                });
        return new Sk.builtin.str(ret);
    }
    else
        throw new TypeError("string indices must be numbers, not " + typeof index);
};

Sk.builtin.str.prototype.sq$length = function()
{
    return this.v.length;
};
Sk.builtin.str.prototype.sq$concat = function(other) { return new Sk.builtin.str(this.v + other.v); };
Sk.builtin.str.prototype.sq$repeat = function(n)
{
    var ret = "";
    for (var i = 0; i < n; ++i)
        ret += this.v;
    return new Sk.builtin.str(ret);
};
Sk.builtin.str.prototype.sq$item = function() { goog.asserts.fail(); };
Sk.builtin.str.prototype.sq$slice = function(i1, i2)
{
    return new Sk.builtin.str(this.v.substr(i1, i2 - i1));
};
// Sk.builtin.str.prototype.sq$contains // iter version is fine

Sk.builtin.str.prototype.tp$name = "str";
Sk.builtin.str.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.str.prototype.tp$iter = function()
{
    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
           return new Sk.builtin.str(ret.$obj.v.substr(ret.$index++, 1));
        }
    };
    return ret;
};
Sk.builtin.str.prototype.tp$repr = function()
{
    // single is preferred
    var quote = "'";
    if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1)
    {
        quote = '"';
    }
    var len = this.v.length;
    var ret = quote;
    for (var i = 0; i < len; ++i)
    {
        var c = this.v.charAt(i);
        if (c === quote || c === '\\')
            ret += '\\' + c;
        else if (c === '\t')
            ret += '\\t';
        else if (c === '\n')
            ret += '\\n';
        else if (c === '\r')
            ret += '\\r';
        else if (c < ' ' || c >= 0x7f)
        {
            var ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) ashex = "0" + ashex;
            ret += "\\x" + ashex;
        }
        else
            ret += c;
    }
    ret += quote;
    return new Sk.builtin.str(ret);
};

Sk.builtin.str.alphanum_ = {};
(function() {
 var i;
 for (i = 'a'; i <= 'z'; ++i) Sk.builtin.str.alphanum_[i] = 1;
 for (i = 'A'; i <= 'Z'; ++i) Sk.builtin.str.alphanum_[i] = 1;
 for (i = '0'; i <= '9'; ++i) Sk.builtin.str.alphanum_[i] = 1;
}());
Sk.builtin.str.re_escape_ = function(s)
{
    var ret = [];
    for (var i = 0; i < s.length; ++i)
    {
        var c = s.charAt(i);
        if (Sk.builtin.str.alphanum_[c])
        {
            ret.push(c);
        }
        else
        {
            if (c === "\\000")
                ret.push("\\000");
            else
                ret.push("\\" + c);
        }
    }
    return ret.join('');
};

Sk.builtin.str.prototype.join = new Sk.builtin.func(function(self, seq)
{
    var arrOfStrs = [];
    for (var it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        if (i.constructor !== Sk.builtin.str) throw "TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found";
        arrOfStrs.push(i.v);
    }
    return new Sk.builtin.str(arrOfStrs.join(self.v));
});

Sk.builtin.str.prototype.split = new Sk.builtin.func(function(self, on, howmany)
{
    var res = self.v.split(new Sk.builtin.str(on).v, howmany);
    var tmp = [];
    for (var i = 0; i < res.length; ++i)
    {
        tmp.push(new Sk.builtin.str(res[i]));
    }
    return new Sk.builtin.list(tmp);
});

Sk.builtin.str.prototype.replace = new Sk.builtin.func(function(self, oldS, newS, count)
{
    if (oldS.constructor !== Sk.builtin.str || newS.constructor !== Sk.builtin.str)
        throw new Sk.builtin.TypeError("expecting a string");
    goog.asserts.assert(count === undefined, "todo; replace() with could not implemented");
    var patt = new RegExp(Sk.builtin.str.re_escape_(oldS.v), "g");
    return new Sk.builtin.str(self.v.replace(patt, newS.v));
});

Sk.builtin.str.prototype.ob$type = Sk.builtin.type.makeTypeObj('str', new Sk.builtin.str(undefined, true));

Sk.builtin.str.prototype.nb$remainder = function(rhs)
{
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next element of the tuple in values, and the object to convert comes after the minimum field width and optional precision.
    // 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes after the precision.
    // 6. Length modifier (optional).
    // 7. Conversion type.
    //
    // length modifier is ignored

    if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) rhs = new Sk.builtin.tuple([rhs]);
    
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    var regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    var index = 0;
    var replFunc = function(substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType)
    {
        var i;
        if (mappingKey === undefined || mappingKey === "" ) i = index++; // ff passes '' not undef for some reason

        var zeroPad = false;
        var leftAdjust = false;
        var blankBeforePositive = false;
        var precedeWithSign = false;
        var alternateForm = false;
        if (conversionFlags)
        {
            if (conversionFlags.indexOf("-") !== -1) leftAdjust = true;
            else if (conversionFlags.indexOf("0") !== -1) zeroPad = true;

            if (conversionFlags.indexOf("+") !== -1) precedeWithSign = true;
            else if (conversionFlags.indexOf(" ") !== -1) blankBeforePositive = true;

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision)
        {
            precision = parseInt(precision.substr(1), 10);
        }

        var formatNumber = function(n, base)
        {
            var j;
            var r;
            var neg = false;
            var didSign = false;
            if (typeof n === "number")
            {
                if (n < 0)
                {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            }
            else if (n instanceof Sk.builtin.lng)
            {
                r = n.str$(base, false);
                neg = n.size$ < 0;
            }

            goog.asserts.assert(r !== undefined, "unhandled number format");

            var precZeroPadded = false;

            if (precision)
            {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j)
                {
                    r = '0' + r;
                    precZeroPadded = true;
                }
            }

            var prefix = '';

            if (neg) prefix = "-";
            else if (precedeWithSign) prefix = "+" + prefix;
            else if (blankBeforePositive) prefix = " " + prefix;

            if (alternateForm)
            {
                if (base === 16) prefix += '0x';
                else if (base === 8 && !precZeroPadded && r !== "0") prefix += '0';
            }

            return [prefix, r];
        };

        var handleWidth = function(args)
        {
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth)
            {
                fieldWidth = parseInt(fieldWidth, 10);
                var totLen = r.length + prefix.length;
                if (zeroPad)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = '0' + r;
                else if (leftAdjust)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = r + ' ';
                else
                    for (j = totLen; j < fieldWidth; ++j)
                        prefix = ' ' + prefix;
            }
            return prefix + r;
        };

        var value;
        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Sk.builtin.tuple)
        {
            value = rhs.v[i];
        }
        else if (rhs.mp$subscript !== undefined)
        {
            var mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.mp$subscript(new Sk.builtin.str(mk));
        }
        else throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        var r;
        var base = 10;
        switch (conversionType)
        {
            case 'd':
            case 'i':
                return handleWidth(formatNumber(value, 10));
            case 'o':
                return handleWidth(formatNumber(value, 8));
            case 'x':
                return handleWidth(formatNumber(value, 16));
            case 'X':
                return handleWidth(formatNumber(value, 16)).toUpperCase();

            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
                var convName = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(conversionType.toLowerCase())];
                var result = (value)[convName](precision);
                if ('EFG'.indexOf(conversionType) !== -1) result = result.toUpperCase();
                // todo; signs etc.
                return handleWidth(['', result]);

            case 'c':
                if (typeof value === "number")
                    return String.fromCharCode(value);
                else if (value instanceof Sk.builtin.lng)
                    return String.fromCharCode(value.digit$[0] & 255);
                else if (value.constructor === Sk.builtin.str)
                    return value.v.substr(0, 1);
                else
                    throw new TypeError("an integer is required");
                break; // stupid lint

            case 'r':
                r = Sk.builtin.repr(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case 's':
                //print("value",value);
                //print("replace:");
                //print("  index", index);
                //print("  substring", substring);
                //print("  mappingKey", mappingKey);
                //print("  conversionFlags", conversionFlags);
                //print("  fieldWidth", fieldWidth);
                //print("  precision", precision);
                //print("  conversionType", conversionType);
                r = Sk.builtin.str(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case '%':
                return '%';
        }
    };
    
    var ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

/*

$.prototype.__getitem__ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("string index out of range");
        return new $(this.v.charAt(index));
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = '';
        index.sssiter$(this, function(i, wrt) {
                if (i >= 0 && i < wrt.v.length)
                    ret += wrt.v.charAt(i);
                });
        return new $(ret);
    }
    else
        throw new TypeError("string indices must be numbers, not " + typeof index);
};

$.prototype.__add__ = function(other)
{
    return new $(this.v + other.v);
};

$.__repr__ = function()
{
    return new $("<type 'str'>");
};

$.prototype.__str__ = function()
{
    // todo; this is probably a bad thing? should return a py obj
    return this.v;
};

$.prototype.richcmp$ = function(rhs, op)
{
    if (rhs.constructor !== $) return false;
    if (this === rhs)
    {
        switch (op)
        {
            case '<': case '>': case '!=': return false;
            case '<=': case '>=': case '==': return true;
        }
    }
    else
    {
        // currently, all strings are intern'd
        return false;
    }
};

//$.prototype.__class__ = new Type$('str', [Sk.types.object], {});

$.capitalize = function() { throw "todo; capitalize"; };
$.center = function() { throw "todo; center"; };
$.count = function() { throw "todo; count"; };
$.decode = function() { throw "todo; decode"; };
$.encode = function() { throw "todo; encode"; };
$.endswith = function() { throw "todo; endswith"; };
$.expandtabs = function() { throw "todo; expandtabs"; };
$.find = function() { throw "todo; find"; };
$.format = function() { throw "todo; format"; };
$.index = function() { throw "todo; index"; };
$.isalnum = function() { throw "todo; isalnum"; };
$.isalpha = function() { throw "todo; isalpha"; };
$.isdigit = function() { throw "todo; isdigit"; };
$.islower = function() { throw "todo; islower"; };
$.isspace = function() { throw "todo; isspace"; };
$.istitle = function() { throw "todo; istitle"; };
$.isupper = function() { throw "todo; isupper"; };

$.join = function(self, seq)
{
    var arrOfStrs = [];
    for (var it = seq.__iter__(), i = it.next(); i !== undefined; i = it.next())
    {
        if (i.constructor !== $) throw "TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found";
        arrOfStrs.push(i.v);
    }
    return arrOfStrs.join(self.v);
};

$.ljust = function() { throw "todo; ljust"; };
$.lower = function() { return new $(this.v.toLowerCase()); };
$.lstrip = function() { throw "todo; lstrip"; };
$.partition = function() { throw "todo; partition"; };

$.replace = function(self, oldS, newS, count)
{
    if (oldS.constructor !== $ || newS.constructor !== $)
        throw "TypeError: expecting a string";
    if (count !== undefined)
        throw "todo; replace() with count not implemented";
    var patt = new RegExp(re_escape(oldS.v), "g");
    return new $(self.v.replace(patt, newS.v));
};

$.rfind = function() { throw "todo; rfind"; };
$.rindex = function() { throw "todo; rindex"; };
$.rjust = function() { throw "todo; rjust"; };
$.rpartition = function() { throw "todo; rpartition"; };
$.rsplit = function() { throw "todo; rsplit"; };
$.rstrip = function() { throw "todo; rstrip"; };

$.split = function(self, on, howmany)
{
    var res = self.v.split(new $(on).v, howmany);
    var tmp = [];
    for (var i = 0; i < res.length; ++i)
    {
        tmp.push(new $(res[i]));
    }
    return new Sk.builtin.list(tmp);
};

$.splitlines = function() { throw "todo; splitlines"; };
$.startswith = function() { throw "todo; startswith"; };
$.strip = function() { throw "todo; strip"; };
$.swapcase = function() { throw "todo; swapcase"; };
$.title = function() { throw "todo; title"; };
$.translate = function() { throw "todo; translate"; };
$.upper = function(self) { return new $(self.v.toUpperCase()); };
$.zfill = function() { throw "todo; zfill"; };
*/
