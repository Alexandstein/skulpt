var $builtinmodule = function(name)
{
    var mod = {};

    mod.random = new Sk.builtin.func(function() {
	return Math.random();
    });

    mod.randint = new Sk.builtin.func(function(low,high) {
	return Math.round(Math.random()*(high-low))+low;
    });

    mod.randrange = new Sk.builtin.func(function(low,high) {
        high = high - 1;
        return Math.round(Math.random()*(high-low))+low;
    });
    return mod;
}