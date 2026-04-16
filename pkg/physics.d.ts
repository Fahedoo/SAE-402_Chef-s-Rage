/* tslint:disable */
/* eslint-disable */

export class Ladder {
    free(): void;
    [Symbol.dispose](): void;
    constructor(x: number, width: number, y_top: number, y_bottom: number);
    width: number;
    x: number;
    y_bottom: number;
    y_top: number;
}

export class Platform {
    free(): void;
    [Symbol.dispose](): void;
    constructor(x: number, y: number, width: number, height: number, slope: number);
    height: number;
    slope: number;
    width: number;
    x: number;
    y: number;
}

export class Player {
    free(): void;
    [Symbol.dispose](): void;
    constructor(x: number, y: number, width: number, height: number);
    height: number;
    is_dropping: boolean;
    jump_boost_ready: boolean;
    on_ground: boolean;
    vx: number;
    vy: number;
    width: number;
    x: number;
    y: number;
}

export class World {
    free(): void;
    [Symbol.dispose](): void;
    add_ladder(x: number, width: number, y_top: number, y_bottom: number): number;
    add_platform(x: number, y: number, w: number, h: number, slope: number): number;
    add_player(x: number, y: number, w: number, h: number): number;
    get_player_on_ground(id: number): boolean;
    get_player_x(id: number): number;
    get_player_y(id: number): number;
    constructor(gravity: number, floor_y: number, width: number);
    player_count(): number;
    player_jump(id: number, jump_speed: number): void;
    set_player_dropping(id: number, dropping: boolean): void;
    set_player_vx(id: number, vx: number): void;
    set_player_vy(id: number, vy: number): void;
    set_player_y(id: number, y: number): void;
    step(dt: number): void;
    width: number;
}
