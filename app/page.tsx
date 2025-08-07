"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { BarChart3, Users, Shield, Building2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("login")

  useEffect(() => {
    if (user && !isLoading) {
      redirect("/dashboard")
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 opacity-30 rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100 opacity-20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-slate-200 opacity-25 rounded-full animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-white bg-opacity-90 rounded-2xl mr-4 shadow-lg">
                <Building2 className="h-10 w-10 text-green-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">PSO Inventory</h1>
                <p className="text-gray-600">Pakistan State Oil</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">
              Professional Inventory Management System
            </h2>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Streamline your organization's inventory operations with advanced analytics, real-time tracking, and
              secure role-based access control.
            </p>

            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-green-700" />
                </div>
                <span>Real-time Analytics & Reporting</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="p-2 bg-teal-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-teal-700" />
                </div>
                <span>Role-based Access Control</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="p-2 bg-slate-100 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-slate-700" />
                </div>
                <span>Secure Data Management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Card className="glass-effect shadow-2xl border border-gray-200">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4 lg:hidden">
                  <div className="p-3 bg-green-100 rounded-2xl">
                    <Building2 className="h-8 w-8 text-green-700" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">
                  Sign in to access your inventory management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="mt-0">
                    <LoginForm />
                  </TabsContent>
                  <TabsContent value="signup" className="mt-0">
                    <SignupForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
