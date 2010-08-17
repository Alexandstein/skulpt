/**
 * @constructor
 * @param {Array.<Object>|Object} L
 */
Sk.builtin.tuple = function(L)
{
    if (L instanceof Sk.builtin.tuple) return;
    if (!(this instanceof Sk.builtin.tuple)) return new Sk.builtin.tuple(L);
    if (Object.prototype.toString.apply(L) === '[object Array]')
        this.v = L;
    else
        this.v = L.v;
    this.__class__ = this.nativeclass$ = Sk.builtin.tuple;
    return this;
};

Sk.builtin.tuple.prototype.tp$repr = function()
{
    if (this.v.length === 0) return new Sk.builtin.str("()");
    var bits = [];
    for (var i = 0; i < this.v.length; ++i)
    {
        bits[i] = Sk.misceval.objectRepr(this.v[i]).v;
    }
    var ret = bits.join(', ');
    if (this.v.length === 1) ret += ",";
    return new Sk.builtin.str("(" + ret + ")");
};

Sk.builtin.tuple.prototype.mp$subscript = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("tuple index out of range");
        return this.v[index];
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Sk.builtin.tuple(ret);
    }
    else
        throw new TypeError("tuple indices must be integers, not " + typeof index);
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Sk.builtin.tuple.prototype.tp$hash = function()
{
    var mult = 1000003;
    var x = 0x345678;
    var len = this.v.length;
    for (var i = 0; i < len; ++i)
    {
        var y = Sk.builtin.hash(this.v[i]);
        if (y === -1) return -1;
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) x = -2;
    return x;
};

Sk.builtin.tuple.prototype.sq$repeat = function(n)
{
    var ret = [];
    for (var i = 0; i < n; ++i)
        for (var j = 0; j < this.v.length; ++ j)
            ret.push(this.v[j]);
    return new Sk.builtin.tuple(ret);
};


Sk.builtin.tuple.prototype.ob$type = Sk.builtin.type.makeTypeObj('tuple', new Sk.builtin.tuple([]));

Sk.builtin.tuple.prototype.tp$iter = function()
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
            return ret.$obj.v[ret.$index++];
        }
    };
    return ret;
};

Sk.builtin.tuple.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a tuple
        
    var v = this.v;
    var w = w.v;
    var vl = v.length;
    var wl = w.length;

    var i;
    for (i = 0; i < vl && i < wl; ++i)
    {
        var k = Sk.misceval.richCompareBool(v[i], w[i], 'Eq');
        if (!k) break;
    }

    if (i >= vl || i >= wl)
    {
        // no more items to compare, compare sizes
        switch (op)
        {
            case 'Lt': return vl < wl;
            case 'LtE': return vl <= wl;
            case 'Eq': return vl === wl;
            case 'NotEq': return vl !== wl;
            case 'Gt': return vl > wl;
            case 'GtE': return vl >= wl;
            default: goog.asserts.fail();
        }
    }

    // we have an item that's different

    // shortcuts for eq/not
    if (op === 'Eq') return false;
    if (op === 'NotEq') return true;

    // or, compare the differing element using the proper operator
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

/*

$.prototype.__add__ = $.prototype.__radd__ = function(other)
{
    return new $(this.v.concat(other.v));
};
*/
