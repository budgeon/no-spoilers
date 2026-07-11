export default function Center({children,py=48}) {
  return <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:`${py}px 0`}}>{children}</div>;
}
