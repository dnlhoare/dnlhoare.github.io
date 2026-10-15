(() => {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

  // Tire forces are isolated from the chassis integration so models can be swapped independently.
  const TireModels = {
    linear(slip, normalLoad, grip) {
      const peak = normalLoad * grip;
      return -clamp(slip * 8.2, -1, 1) * peak;
    },
    pacejka(slip, normalLoad, grip) {
      // Simplified Magic Formula lateral force: D*sin(C*atan(B*a - E*(B*a-atan(B*a))).
      const B = 7.4, C = 1.28, E = -0.65, D = normalLoad * grip;
      const x = B * slip;
      return -D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
    }
  };

  class DriftCar {
    constructor() { this.reset(); this.model = 'linear'; }
    reset() { this.x = 0; this.z = 8; this.heading = 0; this.vx = 0; this.vz = 0; this.yawRate = 0; this.steer = 0; this.rearSlip = 0; this.frontSlip = 0; }
    step(input, dt, tune) {
      const forwardX = Math.sin(this.heading), forwardZ = -Math.cos(this.heading);
      const rightX = Math.cos(this.heading), rightZ = Math.sin(this.heading);
      const speed = this.vx * forwardX + this.vz * forwardZ;
      const lateral = this.vx * rightX + this.vz * rightZ;
      const steeringTarget = input.steer * tune.steering;
      this.steer += (steeringTarget - this.steer) * Math.min(1, dt * 8);
      const frontSlip = Math.atan2(lateral + this.yawRate * 1.15, Math.max(1.5, Math.abs(speed))) - this.steer;
      const rearSlip = Math.atan2(lateral - this.yawRate * 1.25, Math.max(1.5, Math.abs(speed)));
      this.frontSlip = frontSlip; this.rearSlip = rearSlip;

      const model = TireModels[this.model] || TireModels.linear;
      const loadEach = tune.mass * 9.81 * 0.5;
      const frontForce = model(frontSlip, loadEach, tune.grip * 1.04);
      const rearForce = model(rearSlip, loadEach, tune.grip * (input.handbrake ? 0.58 : 0.98));
      const drive = input.throttle * tune.power * (input.throttle < 0 ? 0.62 : 1);
      const brake = input.brake * 13;
      const drag = 0.018 * speed * Math.abs(speed);
      const totalForward = drive - Math.sign(speed || 1) * brake - drag;

      const ax = (totalForward * forwardX + frontForce * (Math.cos(this.steer) * rightX + Math.sin(this.steer) * forwardX) + rearForce * rightX) / tune.mass;
      const az = (totalForward * forwardZ + frontForce * (Math.cos(this.steer) * rightZ + Math.sin(this.steer) * forwardZ) + rearForce * rightZ) / tune.mass;
      this.vx += ax * dt; this.vz += az * dt;
      this.vx *= Math.pow(0.999, dt * 60); this.vz *= Math.pow(0.999, dt * 60);
      this.yawRate += ((frontForce * 1.15 - rearForce * 1.25) / tune.inertia) * dt;
      this.yawRate *= Math.pow(input.handbrake ? 0.997 : 0.985, dt * 60);
      this.heading += this.yawRate * dt;
      this.x += this.vx * dt; this.z += this.vz * dt;
      const newSpeed = Math.hypot(this.vx, this.vz);
      if (newSpeed > 40) { this.vx *= 40 / newSpeed; this.vz *= 40 / newSpeed; }
      return { speed: newSpeed, lateralG: Math.abs(rearForce) / tune.mass / 9.81, angle: newSpeed < 0.2 ? 0 : wrapAngle(Math.atan2(this.vx, -this.vz) - this.heading) };
    }
  }

  window.DriftPhysics = { DriftCar, TireModels, clamp };
})();
