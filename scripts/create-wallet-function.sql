-- Create function to properly update wallet on job completion
CREATE OR REPLACE FUNCTION update_wallet_on_completion(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets 
  SET 
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    pending_amount = CASE 
      WHEN pending_amount >= p_amount THEN pending_amount - p_amount 
      ELSE 0 
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
