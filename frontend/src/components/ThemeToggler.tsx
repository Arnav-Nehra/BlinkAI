'use client'
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { memo, useCallback } from "react";
import {useTheme} from "next-themes"

function ThemeToggler({className} : {className?:string}){
  const {theme, setTheme} = useTheme();
  const onClick = useCallback(() => {
    setTheme(theme ===  "dark" ? "light" : "dark")
  }, [theme, setTheme]);
  return  <Button
  variant={"ghost"}
  size={"icon"}
  onClick={onClick}
  className={`${className}` }
  >
    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"/>
    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"/>
    <span className="sr-only">Toggle Theme</span>
  </Button>
}

export default memo(ThemeToggler)