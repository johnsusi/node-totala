#!/usr/bin/env python
import ctypes
import glob
import importlib
import math
import random
import pathlib


angular_scale = 1.0 / 182.0
linear_scale = 1.0 / 163840.0

def to_signed(number):
  return ctypes.c_int32(number).value

def axis_to_string(axis):
    if axis == 0:
        return 'x-axis'
    if axis == 1:
        return 'y-axis'
    if axis == 2:
        return 'z-axis'
    return f'{axis}'

class StackFrame:
  method = ''
  ip = 0
  args = []
  registers = []


class Machine:

    ip = 0
    stack = []
    done = False
    verbose = True

    static_vars = {}

    code = []
    pieces = []
    scripts = {}
    frames = []

    def log(self, str):
        if self.verbose:
            print(str)

    def move_with_speed(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        deg = to_signed(self.stack.pop()) * linear_scale
        speed = to_signed(self.stack.pop()) * linear_scale
        self.ip += 3
        self.log(
            f'move {piece} to {axis_to_string(axis)} [{deg}] speed [{speed}]')

    def turn_with_speed(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        deg = to_signed(self.stack.pop()) * angular_scale
        speed = to_signed(self.stack.pop()) * angular_scale
        self.ip += 3
        self.log(
            f'turn {piece} to {axis_to_string(axis)} [{deg}] speed <{speed}>')

    def spin(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        speed = to_signed(self.stack.pop()) * angular_scale
        self.ip += 3
        self.log(f'spin {piece} around {axis_to_string(axis)} speed <{speed}>')

    def stop_spin(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        self.ip += 3
        self.log(f'stop-spin {piece} around {axis_to_string(axis)}')

    def show(self):
        index = self.code[self.ip + 1]
        piece = self.pieces[index]
        self.ip += 2
        self.log(f'show {piece}')

    def hide(self):
        index = self.code[self.ip + 1]
        piece = self.pieces[index]
        self.ip += 2
        self.log(f'hide {piece}')

    def cache(self):
        index = self.code[self.ip + 1]
        piece = self.pieces[index]
        self.ip += 2
        self.log(f'cache {piece}')

    def dont_cache(self):
        index = self.code[self.ip + 1]
        piece = self.pieces[index]
        self.ip += 2
        self.log(f'dont-cache {piece}')

    def move_now(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        deg = to_signed(self.stack.pop()) * linear_scale
        self.ip += 3
        self.log(f'move {piece} to {axis_to_string(axis)} [{deg}] now')

    def turn_now(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        deg = to_signed(self.stack.pop()) * angular_scale
        self.ip += 3
        self.log(f'turn {piece} to {axis_to_string(axis)} [{deg}] now')

    def dont_shade(self):
        index = self.code[self.ip + 1]
        piece = self.pieces[index]
        self.ip += 2
        self.log(f'dont-shade {piece}')

    def emit_sfx(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        value = self.stack.pop()
        self.ip += 2
        self.log(f'emit-sfx {value} from {piece}')

    def wait_for_turn(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        self.ip += 3
        self.log(f'wait-for-turn {piece} around {axis_to_string(axis)}')

    def wait_for_move(self):
        index = self.code[self.ip+1]
        piece = self.pieces[index]
        axis = self.code[self.ip+2]
        self.ip += 3
        self.log(f'wait-for-move {piece} along {axis_to_string(axis)}')

    def sleep(self):
        time = self.stack.pop()
        self.ip += 1
        self.log(f'sleep {time}')

    def push_constant(self):
        value = self.code[self.ip+1]
        self.stack.append(value)
        self.ip += 2
        self.log(f'push-const {value}')

    def push_var(self):
        index = self.code[self.ip+1]
        value = self.frame.registers[index]
        self.stack.append(value)
        self.ip += 2
        self.log(f'push-var {value}')

    def push_static(self):
        index = self.code[self.ip+1]
        value = self.static_vars.get(index, 0)
        self.stack.append(value)
        self.ip += 2
        self.log(f'push-static {value}')

    def stack_alloc(self):
        self.frame.registers.append(0)
        self.ip += 1
        self.log(f'stack-alloc')

    def set_var(self):
        index = self.code[self.ip+1]
        value = self.stack.pop()
        self.frame.registers[index] = value
        self.ip += 2
        self.log(f'set-var {value}')

    def set_static(self):
        index = self.code[self.ip+1]
        value = self.stack.pop()
        self.ip += 2
        self.log(f'set-static {value}')

    def add(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        self.stack.append(lhs-rhs)
        self.ip += 1
        self.log(f'{lhs} + {rhs}')

    def sub(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        self.stack.append(lhs-rhs)
        self.ip += 1
        self.log(f'{lhs} - {rhs}')

    def mul(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        self.stack.append(lhs*rhs)
        self.ip += 1
        self.log(f'{lhs} * {rhs}')

    def div(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        self.stack.append(lhs*rhs)
        self.ip += 1
        self.log(f'{lhs} / {rhs}')

    def bitwise_or(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        self.stack.append(lhs | rhs)
        self.ip += 1
        self.log(f'{lhs} | {rhs}')

    def rand(self):
        hi = self.stack.pop()
        lo = self.stack.pop()
        self.stack.append(random.randint(lo, hi))  # should be value
        self.ip += 1
        self.log(f'rand({lo},{hi})')

    def get(self):
        port = self.stack.pop()
        self.stack.append(0)  # should be value
        self.ip += 1
        self.log(f'get {port}')

    def jmp_if(self):
        offset = self.code[self.ip+1]
        value = self.stack.pop()
        if value == 0:
            self.ip = offset
        else:
            self.ip += 2
        self.log(f'jmp-if {value}')

    def less(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        if lhs < rhs:
            self.stack.append(1)
        else:
            self.stack.append(0)
        self.ip += 1
        self.log(f'{lhs} < {rhs}')

    def less_or_eq(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        if lhs <= rhs:
            self.stack.append(1)
        else:
            self.stack.append(0)
        self.ip += 1
        self.log(f'{lhs} <= {rhs}')

    def eq(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        if lhs == rhs:
            self.stack.append(1)
        else:
            self.stack.append(0)
        self.ip += 1
        self.log(f'{lhs} == {rhs}')

    def not_eq(self):
        rhs = self.stack.pop()
        lhs = self.stack.pop()
        if lhs != rhs:
            self.stack.append(1)
        else:
            self.stack.append(0)
        self.ip += 1
        self.log(f'{lhs} != {rhs}')

    def bitwise_not(self):
        value = self.stack.pop()
        self.stack.append(~value)
        self.ip += 1
        self.log(f'~{value}')

    def start_script(self):
        name = list(self.scripts)[self.code[self.ip+1]]
        self.ip = self.scripts[name]
        self.log(f'start-script {name}')

    def call_script(self):
        name = list(self.scripts)[self.code[self.ip+1]]
        argno = self.code[self.ip+2]
        frame = StackFrame()
        frame.name = name
        frame.ip = self.ip + 3
        self.ip = self.scripts[name]
        for i in range(0, argno):
          frame.registers.append(self.stack.pop())
        self.frame = frame
        self.frames.append(frame)
        self.log(f'call-script {name} {argno}')

    def jmp(self):
        offset = self.code[self.ip+1]
        self.ip = offset
        self.log('jmp')

    def handle_return(self):
      self.ip = self.frames.pop().ip
      self.log('return')

    def signal(self):
        value = self.stack.pop()
        self.ip += 1
        self.log(f'signal {value}')

    def set_signal_mask(self):
        value = self.stack.pop()
        self.ip += 1
        self.log(f'set-signal-mask {value}')

    def explode(self):
        piece = self.pieces[self.code[self.ip+1]]
        type = self.stack.pop()
        self.ip += 2
        self.log(f'explode {piece} type {type}')

    def set(self):
        what = self.stack.pop()
        value = self.stack.pop()
        self.ip += 1
        self.log(f'set {what} to {value}')

    def run(self, name, args = []):

        self.frame = StackFrame()
        self.frame.name = name
        self.ip = self.scripts[name]
        self.frame.args = args
        self.frames.append(self.frame)

        def handle():
            print('unknown self.code', hex(self.code[self.ip]))
            self.done = True

        handles = dict([
            (0x10001000, self.move_with_speed),
            (0x10002000, self.turn_with_speed),
            (0x10003000, self.spin),
            (0x10004000, self.stop_spin),
            (0x10005000, self.show),
            (0x10006000, self.hide),
            (0x10007000, self.cache),
            (0x10008000, self.dont_cache),
            (0x1000b000, self.move_now),
            (0x1000c000, self.turn_now),
            (0x1000e000, self.dont_shade),
            (0x1000f000, self.emit_sfx),
            (0x10011000, self.wait_for_turn),
            (0x10012000, self.wait_for_move),
            (0x10013000, self.sleep),
            (0x10021001, self.push_constant),
            (0x10021002, self.push_var),
            (0x10021004, self.push_static),
            (0x10022000, self.stack_alloc),
            (0x10023002, self.set_var),
            (0x10023004, self.set_static),
            (0x10031000, self.add),
            (0x10032000, self.sub),
            (0x10033000, self.mul),
            (0x10034000, self.div),
            (0x10036000, self.bitwise_or),
            (0x10041000, self.rand),
            (0x10042000, self.get),
            (0x10051000, self.less),
            (0x10052000, self.less_or_eq),
            (0x10055000, self.eq),
            (0x10056000, self.not_eq),
            (0x1005a000, self.bitwise_not),
            (0x10061000, self.start_script),
            (0x10062000, self.call_script),
            (0x10064000, self.jmp),
            (0x10065000, self.handle_return),
            (0x10066000, self.jmp_if),
            (0x10067000, self.signal),
            (0x10068000, self.set_signal_mask),
            (0x10071000, self.explode),
            (0x10082000, self.set),
        ])

        while len(self.frames) > 0:
          handles.get(self.code[self.ip], handle)()

for name in glob.glob('./export/**/armbrawl.py'):
  print(pathlib.Path(name).stem)
  unit = importlib.import_module(f'export.scripts.{pathlib.Path(name).stem}')
  m = Machine()
  m.code = unit.code
  m.pieces = unit.pieces
  m.scripts = unit.scripts
  # m.run("StartMoving", [])
  m.run("activatescr", [])
