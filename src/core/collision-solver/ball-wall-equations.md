# Ball to wall collision equations

**Assumptions (used below).**

* Line 1 (wall): point $P_1=(x_1, y_1)$, angle $\alpha$, direction $d_1=(\cos\alpha, \sin\alpha)$.
* Ball centre moves along Line 2 direction $d_2=(\cos\beta, \sin\beta)$.
* The ball’s initial centre is $P_2=(x_2, y_2)$.
* Initial speed along the direction is scalar $v$ (signed: positive in direction $d_2$, negative opposite).
* Constant acceleration along the same line is scalar $a$ (signed).
* Ball radius is $r>0$.

Define the 2-D cross: $\operatorname{cross}(a, b)=a_x b_y-a_y b_x$.

Also a unit normal to Line 1: $n_1 = (-\sin\alpha, \cos\alpha)$.

## Collision equations

### 1) Parametric centre position

The centre position at time $t$ is
$$
C(t) = P_2 + d_2\bigl(vt + \tfrac12 a t^2\bigr).
$$

### 2) Signed distance (via 2D cross product)

Define $\operatorname{cross}(u, v)=u_x v_y - u_y v_x$. Let
$$
\Delta = \operatorname{cross}(d_2,d_1) = \sin(\alpha-\beta)
$$

$$
C_0 = \operatorname{cross}(P_2-P_1, d_1)
$$

The signed distance from $C(t)$ to the wall (measured with sign consistent with $n_1$) equals
$$
\operatorname{cross}\bigl(C(t)-P_1, d_1\bigr)
= C_0 + \bigl(vt+\tfrac12 a t^2\bigr) \Delta
$$

The ball first contacts the wall when this signed distance equals $\sigma r$ for $\sigma\in{+1,-1}$ (choose both signs because the ball may hit either side).

So solve for $t$ the equation
$$
C_0 + \bigl(vt+\tfrac12 a t^2\bigr)\Delta = \sigma r
$$

Rearrange to a quadratic:
$$
\frac12 a\Delta t^2 + v\Delta t + (C_0 - \sigma r) = 0
\tag{*}
$$

### 3) Solve cases

#### Case A — $\Delta \neq 0$ (non-parallel paths)

Solve the quadratic $(*)$ for each $\sigma\in\{+1,-1\}$.

* If $a\Delta \neq 0$ use quadratic formula:
  $$
  t = \frac{-v\Delta \pm \sqrt{(v\Delta)^2 - 2 a\Delta (C_0-\sigma r)}}{a\Delta}
  $$
  Keep only **real** roots with $t\ge 0$. (Be careful with sign of $a\Delta$ when interpreting $\pm$).

* If $a\Delta = 0$ but $\Delta\neq0$ (i.e. $a=0$):
  $$
  v\Delta t + (C_0-\sigma r)=0
  \quad\Rightarrow\quad
  t = \frac{\sigma r - C_0}{v\Delta}
  $$
  again accept $t\ge0$ only (and require $v\neq0$). If $v=0$ and $a=0$ the centre is static — collision only if $C_0=\sigma r$ at $t=0$.

After solving for both $\sigma$, **pick the smallest nonnegative root** $t_{\text{collision}}$. If no nonnegative real root exists for either sign, there is no future collision.

#### Case B — $\Delta = 0$ (path parallel or collinear with the wall)

Then the signed distance from the centre to the wall is constant:
$$
\operatorname{cross}\bigl(C(t)-P_1, d_1\bigr)=C_0\quad\text{for all }t.
$$

* If $C_0 = \sigma r$ for some $\sigma$ then the ball is initially grazing that offset line (contact for all $t$, or immediate contact at $t=0$).
* Otherwise the path never reaches the wall (no collision), because the centre line is always at the same distance.

### 4) Compute collision location (if you found $t_{\text{collision}}$)

* Centre at contact:
  $${
  C = P_2 + d_2\bigl(vt_{\text{collision}} + \tfrac12 a t_{\text{collision}}^2\bigr)
  }$$
* Unit normal to wall (pointing one chosen side): $n_1 = (-\sin\alpha, \cos\alpha)$. If collision came from sign $\sigma$, the contact point on the wall is
  $${
  Q = C - \sigma r n_1
  }$$
  (or $Q=C+\sigma r n_1$ depending on which sign-convention you used for $n_1$; use the same convention as for $C_0$).

If the wall is a finite segment, verify that $Q$ lies inside the segment bounds (e.g., project $Q-P_1$ onto the segment direction and check limits). If $Q$ lies outside, there is no collision with that finite segment.

### 5) Practical notes

* Numerical stability: when discriminant is very small treat roots carefully (possible grazing).
* If you only care about the *first* collision in future, always pick the **smallest** real root $t\ge0$ among all solutions for $\sigma=\pm1$. If a root equals zero, collision is immediate.

## Reflection equations

After the ball collides elastically with a straight wall, its velocity vector is reflected about the wall’s tangent.

### 1) Define the velocity before collision

At the collision time, the ball’s velocity vector is
$$
v = (v_x, v_y)
$$
(You can get this from motion law: $v(t) = v d_2 + a t d_2$ if acceleration is along the path, or more generally $v(t)=v_0 + a t$.)

### 2) Reflect velocity

Decompose $v$ into tangential and normal components relative to the wall:
$$
v_\parallel = (v \cdot d_1) d_1
$$

$$
v_\perp = (v \cdot n) n
$$

On an ideal elastic collision with an immovable wall:
$$
v' = v_\parallel - v_\perp
$$

Equivalently (single formula):
$$
v' = v - 2(v \cdot n) n
$$

### 3) New direction angle

If you want the **new trajectory angle** $\beta'$:
$$
\beta' = \operatorname{atan2}(v'_y, v'_x)
$$

This covers the ideal, frictionless, perfectly elastic reflection.
If the wall absorbs energy, you can multiply the normal component by a restitution coefficient $e \in [0,1]$:
$$
v' = v_\parallel - e v_\perp
$$

## Angle-only reflection equations

If you only care about the **direction angle** (not the exact vector magnitude), you don’t need to work with dot/cross products.

### Key idea

An elastic reflection is a **mirror of the motion angle** across the wall’s angle.

* Ball’s incoming direction angle: $\beta$.
* Wall direction angle (tangent to wall): $\alpha$.
* Outgoing direction angle: $\beta'$.

### Formula

$$
\beta' = 2\alpha - \beta
$$

### Why this works

* Imagine the wall lying along angle $\alpha$.
* The angle between the ball’s direction and the wall is $\theta = \beta - \alpha$.
* After reflection, this angle flips sign: $-\theta$.
* So the new angle is
  $$
  \beta' = \alpha - \theta = \alpha - (\beta - \alpha) = 2\alpha - \beta
  $$

### Notes

* Be careful with modulo $2\pi$ (or $360^\circ$): if $\beta'$ comes out negative, add $2\pi$.
* Works for **ideal elastic reflection**.
* If you have a coefficient of restitution $e$, this formula still gives the **direction** (the angle is unchanged, only the speed component normal to the wall is scaled).
