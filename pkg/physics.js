/* @ts-self-types="./physics.d.ts" */

class Ladder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LadderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ladder_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_ladder_width(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_ladder_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get y_bottom() {
        const ret = wasm.__wbg_get_ladder_y_bottom(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get y_top() {
        const ret = wasm.__wbg_get_ladder_y_top(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} x
     * @param {number} width
     * @param {number} y_top
     * @param {number} y_bottom
     */
    constructor(x, width, y_top, y_bottom) {
        const ret = wasm.ladder_new(x, width, y_top, y_bottom);
        this.__wbg_ptr = ret >>> 0;
        LadderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_ladder_width(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_ladder_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set y_bottom(arg0) {
        wasm.__wbg_set_ladder_y_bottom(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set y_top(arg0) {
        wasm.__wbg_set_ladder_y_top(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Ladder.prototype[Symbol.dispose] = Ladder.prototype.free;
exports.Ladder = Ladder;

class Platform {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PlatformFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_platform_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_platform_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get slope() {
        const ret = wasm.__wbg_get_platform_slope(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_platform_width(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_platform_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get y() {
        const ret = wasm.__wbg_get_platform_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} slope
     */
    constructor(x, y, width, height, slope) {
        const ret = wasm.platform_new(x, y, width, height, slope);
        this.__wbg_ptr = ret >>> 0;
        PlatformFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_platform_height(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set slope(arg0) {
        wasm.__wbg_set_platform_slope(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_platform_width(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_platform_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set y(arg0) {
        wasm.__wbg_set_platform_y(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Platform.prototype[Symbol.dispose] = Platform.prototype.free;
exports.Platform = Platform;

class Player {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PlayerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_player_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_player_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get is_dropping() {
        const ret = wasm.__wbg_get_player_is_dropping(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get jump_boost_ready() {
        const ret = wasm.__wbg_get_player_jump_boost_ready(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get on_ground() {
        const ret = wasm.__wbg_get_player_on_ground(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get vx() {
        const ret = wasm.__wbg_get_player_vx(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get vy() {
        const ret = wasm.__wbg_get_player_vy(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_player_width(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_player_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get y() {
        const ret = wasm.__wbg_get_player_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(x, y, width, height) {
        const ret = wasm.player_new(x, y, width, height);
        this.__wbg_ptr = ret >>> 0;
        PlayerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_player_height(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set is_dropping(arg0) {
        wasm.__wbg_set_player_is_dropping(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set jump_boost_ready(arg0) {
        wasm.__wbg_set_player_jump_boost_ready(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set on_ground(arg0) {
        wasm.__wbg_set_player_on_ground(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set vx(arg0) {
        wasm.__wbg_set_player_vx(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set vy(arg0) {
        wasm.__wbg_set_player_vy(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_player_width(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_player_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set y(arg0) {
        wasm.__wbg_set_player_y(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Player.prototype[Symbol.dispose] = Player.prototype.free;
exports.Player = Player;

class World {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WorldFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_world_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_world_width(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_world_width(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} x
     * @param {number} width
     * @param {number} y_top
     * @param {number} y_bottom
     * @returns {number}
     */
    add_ladder(x, width, y_top, y_bottom) {
        const ret = wasm.world_add_ladder(this.__wbg_ptr, x, width, y_top, y_bottom);
        return ret >>> 0;
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} slope
     * @returns {number}
     */
    add_platform(x, y, w, h, slope) {
        const ret = wasm.world_add_platform(this.__wbg_ptr, x, y, w, h, slope);
        return ret >>> 0;
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @returns {number}
     */
    add_player(x, y, w, h) {
        const ret = wasm.world_add_player(this.__wbg_ptr, x, y, w, h);
        return ret >>> 0;
    }
    /**
     * @param {number} id
     * @returns {boolean}
     */
    get_player_on_ground(id) {
        const ret = wasm.world_get_player_on_ground(this.__wbg_ptr, id);
        return ret !== 0;
    }
    /**
     * @param {number} id
     * @returns {number}
     */
    get_player_x(id) {
        const ret = wasm.world_get_player_x(this.__wbg_ptr, id);
        return ret;
    }
    /**
     * @param {number} id
     * @returns {number}
     */
    get_player_y(id) {
        const ret = wasm.world_get_player_y(this.__wbg_ptr, id);
        return ret;
    }
    /**
     * @param {number} gravity
     * @param {number} floor_y
     * @param {number} width
     */
    constructor(gravity, floor_y, width) {
        const ret = wasm.world_new(gravity, floor_y, width);
        this.__wbg_ptr = ret >>> 0;
        WorldFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    player_count() {
        const ret = wasm.world_player_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} id
     * @param {number} jump_speed
     */
    player_jump(id, jump_speed) {
        wasm.world_player_jump(this.__wbg_ptr, id, jump_speed);
    }
    /**
     * @param {number} id
     * @param {boolean} dropping
     */
    set_player_dropping(id, dropping) {
        wasm.world_set_player_dropping(this.__wbg_ptr, id, dropping);
    }
    /**
     * @param {number} id
     * @param {number} vx
     */
    set_player_vx(id, vx) {
        wasm.world_set_player_vx(this.__wbg_ptr, id, vx);
    }
    /**
     * @param {number} id
     * @param {number} vy
     */
    set_player_vy(id, vy) {
        wasm.world_set_player_vy(this.__wbg_ptr, id, vy);
    }
    /**
     * @param {number} id
     * @param {number} y
     */
    set_player_y(id, y) {
        wasm.world_set_player_y(this.__wbg_ptr, id, y);
    }
    /**
     * @param {number} dt
     */
    step(dt) {
        wasm.world_step(this.__wbg_ptr, dt);
    }
}
if (Symbol.dispose) World.prototype[Symbol.dispose] = World.prototype.free;
exports.World = World;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./physics_bg.js": import0,
    };
}

const LadderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ladder_free(ptr >>> 0, 1));
const PlatformFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_platform_free(ptr >>> 0, 1));
const PlayerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_player_free(ptr >>> 0, 1));
const WorldFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_world_free(ptr >>> 0, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const wasmPath = `${__dirname}/physics_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
let wasm = new WebAssembly.Instance(wasmModule, __wbg_get_imports()).exports;
wasm.__wbindgen_start();
