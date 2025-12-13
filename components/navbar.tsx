"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Loader2, LogOut, Menu } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

export function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)

  const navItems = [
    { href: "/configure", label: "Configure" },
    { href: "/queue", label: "Queue" },
    { href: "/accounts-setup", label: "Account Setup" }
  ]

  // Don't render navbar if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <nav className="bg-white mt-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
                <Link href="/configure">
                <Image
                  src="/aivs logo.JPG"
                  alt="AIVS Logo"
                  width={40}
                  height={40}
                  className="object-contain cursor-pointer rounded-full"
                  priority
                />
                </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-1 pt-1 text-sm font-medium",
                    pathname === item.href
                      ? "border-b-2 border-primary text-gray-900"
                      : "text-gray-500 hover:border-gray-300 hover:text-gray-700",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center">
              {!isLoading ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsSignOutDialogOpen(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <div className="sm:hidden ml-2">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                      <span className="sr-only">Open main menu</span>
                      <Menu className="h-6 w-6" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    {navItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "block px-3 py-2 text-base font-medium",
                            pathname === item.href
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <LogoutConfirmationDialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
      />
    </>
  )
}

