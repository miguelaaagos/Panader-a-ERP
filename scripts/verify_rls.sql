
SELECT policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('ventas', 'detalle_ventas');
