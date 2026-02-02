$base='http://localhost:4004'
$cookie = Join-Path $pwd 'broker.cookie'
function CurlJson($method,$url,$body,$cookieOut){
  $args=@('-s','-X',$method,$url,'-H','Content-Type: application/json')
  if($cookieOut){$args+=@('-c',$cookieOut)}
  if($body){return ($body | & curl.exe @args --data-binary "@-")}
  return (& curl.exe @args)
}
$login = CurlJson 'POST' "$base/api/sign-in/FRONTEND" '{"email":"broker.test@guzur.com","password":"Test1234!"}' $cookie
Write-Host "LOGIN=$login"
Write-Host "COOKIE_FILE:"
Get-Content $cookie | Write-Host
