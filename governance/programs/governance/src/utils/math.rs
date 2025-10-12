pub const FP_SCALE: u128 = 1_000_000;



pub fn fp_div(a: u128, b: u128) -> u128 {
    (a * FP_SCALE) / b
}

pub fn fp_mul(a: u128, b: u128) -> u128 {
    (a * b) / FP_SCALE
}

pub fn calc_weight_fp(stake_amount: u64) -> u128 {
    // base = log2(1 + stake_amount)
    let mut n = stake_amount + 1;
    let mut log2_val = 0u128;

    while n > 1 {
        n >>= 1;  
        log2_val += 1;
    }


    let weight_fp = (1_000_000u128 * (1 + log2_val as u128));
    weight_fp
}