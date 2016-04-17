// Raspberry Pi Motor Control
var gpio_up   = 15;
var gpio_down = 14;
var gpio_pwm  = 18;
var gpio_hor  = "P1-7";
var spd_val   = 0;
var hor_val   = 50; // 100:right 0:left
var dir_val   = "stop";
var hor_base = 50;
var hor_max = 15;

var exec = require("child_process").exec
exec("gpio -g mode " + gpio_down + " out");
exec("gpio -g mode " + gpio_up + " out");
exec("gpio -g mode " + gpio_pwm  + " pwm");
exec("servod --p1pins=7 --pcm");

module.exports = {
  // cmd: 0 ~ 100 %
  raspSetHor: function (val)
  {
    // console.log(val);
    var hor;

      hor = hor_base + val;

    if(hor > hor_base + hor_max ) hor = hor_base + hor_max;
    else if(hor < hor_base - hor_max) hor = hor_base - hor_max;

    if(hor != hor_val) {
      hor_val = hor;
      var exec_cmd = "echo " + gpio_hor + "=" + hor_val.toFixed(0) + "% > /dev/servoblaster";
      //exec("servod --p1pins=7 --p5pins=0");
      //console.log(exec_cmd);
        exec(exec_cmd);
        //exec("gpio -g mode " + gpio_pwm  + " pwm");
      }
  },

  // cmd: stop, up, down, right, left
  raspSetDir: function (cmd)
  {
    var dir_up = 0;
    var dir_down = 0;

    if( cmd != dir_val )
    {
      if (cmd === "stop"){
      dir_up   = 0;
      dir_down = 0;
      } else if(cmd === "up"){
      dir_up   = 1;
      dir_down = 0;
      } else if(cmd === "down"){
      dir_up   = 0;
      dir_down = 1;
      } else if(cmd === "right"){
        hor_val += 10;
      } else if(cmd === "left"){
        hor_val -= 10;
      }

      dir_val = cmd;

      if(dir_val == "right" || dir_val == "left")
      {
      if(hor_val > 100) hor_val    = 100;
      else if(hor_val < 0) hor_val = 0;
        exec("echo " + gpio_hor + "=" + hor_val + "% > /dev/servoblaster");
      } else {
        exec("gpio -g write " + gpio_up + " " + dir_up);
        exec("gpio -g write " + gpio_down + " " + dir_down);
      }
    }
  },

  raspMove: function (val)
  {
    // hor
    this.raspSetHor(val[0]);

    // ver
    var spd;
    if(val[1] > 0 ) {
    	spd = val[1];
    	this.raspSetDir("up");
    } else {
    	spd = -val[1];
    	this.raspSetDir("down");
    }
    this.raspSetSpd(spd);
  },

  // cmd: 0 ~ 100 %
  raspSetSpd: function (val)
  {
    // spd: 0 ~ 1024
    var spd = 200 + (1024 - 200) * (val / 100);

    if(spd < 0) {
      spd = 0;
    } else if (spd > 1024) {
      spd = 1024;
    }

    if (spd != spd_val) {
      spd_val = spd;
      exec("gpio -g pwm " + gpio_pwm  + " " + spd_val);
    }
  },

  exitProc: function ()
  {
    this.raspSetDir("stop");
    this.raspSetHor(0);
    exec("kill `pidof servod`");
    console.log("EXIT");
    process.exit(1);
  }
};