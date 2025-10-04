pub const FP_SCALE: u128 = 1_000_000;

pub const FP_SCALE: u128 = 1_000_000;

pub fn fp_div(a: u128, b: u128) -> u128 {
    (a * FP_SCALE) / b
}

pub fn fp_mul(a: u128, b: u128) -> u128 {
    (a * b) / FP_SCALE
}
