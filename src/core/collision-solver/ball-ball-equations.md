# Ball to ball collision equations

**Assumptions (used below).**

* Fixed ball:
  * centre: $P_1=(x_1, y_1)$,
  * radius $r_1$.

* Moving ball:
  * initial centre: $P_2=(x_2, y_2)$,
  * initial velocity: scalar $v$ along direction $d_2=(\cos\beta, \sin\beta)$,
  * acceleration: scalar $a$ along $d_2$,
  * radius $r_2$.

Let $R = r_1 + r_2$ be the collision distance.

## Collision equations

### 1. Centre position of moving ball

Displacement along $d_2$:
$$
s(t) = v t + \tfrac12 a t^2
$$
So centre position is
$$
C(t) = P_2 + s(t) d_2
$$

### 2. Collision condition

We need
$$
|C(t) - P_1|^2 = R^2
$$

Let $\Delta P = P_2 - P_1$. Then
$$
C(t)-P_1 = \Delta P + s(t) d_2
$$

So
$$
|\Delta P + s(t) d_2|^2 = R^2
$$

### 3. Expand

$$
(\Delta P \cdot \Delta P) + 2s(t)(\Delta P \cdot d_2) + s(t)^2|d_2|^2 = R^2
$$

Since $d_2$ is unit length, $|d_2|^2=1$. Define:

* $d_0^2 = |\Delta P|^2$,
* $k = \Delta P \cdot d_2$.

Then condition becomes:
$$
s(t)^2 + 2k s(t) + d_0^2 - R^2 = 0
$$

### 4. Plug $s(t)$

Recall $s(t) = v t + \tfrac12 a t^2$. So:

$$
\bigl(v t + \tfrac12 a t^2\bigr)^2 + 2k\bigl(v t + \tfrac12 a t^2\bigr) + (d_0^2 - R^2) = 0
$$

This is a polynomial in $t$ of degree up to 4 (quartic).

### 5. Special cases

* If $a=0$ (constant velocity), then $s(t)=vt$, the equation reduces to a quadratic in $t$:
  $$
  (v t)^2 + 2k (v t) + (d_0^2 - R^2) = 0
  $$
  which is
  $$
  v^2 t^2 + 2kv t + (d_0^2 - R^2)=0
  $$

  Easy to solve with quadratic formula, then take the smallest nonnegative root.

* If $a\neq 0$, you generally have a quartic. Standard quartic solvers (or numerical root-finders) can be used. Among all real roots, choose the **smallest $t\ge 0$**.

### 6. Practical steps

1. Compute $\Delta P=(x_2-x_1, y_2-y_1)$.
2. Compute $d_0^2=|\Delta P|^2$.
3. Compute $k = \Delta P \cdot d_2$.
4. Build the polynomial above.
5. Solve it for $t$.
6. Pick the smallest nonnegative solution.

## Reflection equations

Treat the fixed ball like a circular wall. At the instant of contact, reflect the velocity about the **tangent of the circle** at the contact point (equivalently, flip the normal component).

### Vector formula (most robust)

Let

* $C$ be your moving ball’s center **at impact** (you can get $C$ from your collision-time solution),
* $v$ the velocity **just before** impact.

1. Unit **outward normal** at contact (from fixed center to moving center):
   $$
   n=\frac{C-P_1}{|C-P_1|}
   $$

2. Perfectly elastic, frictionless reflection:
   $$
   v' = v - 2(v\cdot n)n
   $$

With coefficient of restitution $e\in[0,1]$ (still frictionless):
$$
v' = v - (1+e)(v\cdot n)n
$$
($e=1$ elastic, $e=0$ “sticky” in the normal direction.)

If you want to include tangential energy loss (sliding friction), also scale the tangential part:
$$
v_t=v-(v\cdot n)n
$$

$$
v_n=(v\cdot n)n
$$

$$
v' = (1-\mu)v_t + e v_n
$$

with $0\le \mu\le 1$ a chosen tangential damping.

### Angle-only version

Let $\beta=\operatorname{atan2}(v_y,v_x)$ be the incoming direction.

Let $\theta=\operatorname{atan2}(C_y-y_1,C_x-x_1)$ be the **normal angle** (from fixed center to impact center).

The **tangent angle** is $\alpha=\theta+\tfrac{\pi}{2}$. Then
$$
\beta' = 2\alpha - \beta = 2!\left(\theta+\tfrac{\pi}{2}\right)-\beta \pmod{2\pi}
$$
(Equivalent to reflecting across the tangent.)

### Notes & edge cases

* If $(v\cdot n)=0$ (perfect graze), $v'=v$.
* Make sure you use the **normal at the actual impact point** (i.e., at the collision time), not at the initial position.
