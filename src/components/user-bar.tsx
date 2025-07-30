// src/components/user-bar.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Upload } from "lucide-react"
import { signOut, useSession } from "@/lib/auth/auth-client"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useProfile, useSaveProfile, BusinessProfile } from "@/hooks/use-profile"

export default function UserBar() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileData, setProfileData] = useState<BusinessProfile>({
    businessName: "",
    phone: "",
    email: "",
    address: "",
    logo: ""
  })

  // Profile hooks
  const { data: profile, isLoading: isLoadingProfile } = useProfile()
  const saveProfileMutation = useSaveProfile()

  if (isPending || !session) return null

  const user = session.user

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/")
        },
      },
    })
  }

  const handleProfileOpen = () => {
    setIsProfileOpen(true)
    // Load existing profile data if available
    if (profile) {
      setProfileData(profile)
    } else {
      setProfileData({
        businessName: user.name || "",
        phone: "",
        email: user.email || "",
        address: "",
        logo: user.image || ""
      })
    }
  }

  const handleProfileSave = async () => {
    try {
      await saveProfileMutation.mutateAsync(profileData)
      toast.success("Profile updated successfully!")
      setIsProfileOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          logo: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full rounded-lg px-3 py-2 hover:bg-muted transition-colors">
            <Avatar className="h-8 w-8 flex-shrink-0">
              {(profile?.logo || user.image) ? (
                <AvatarImage src={(profile?.logo || user.image) ?? undefined} alt={user.name ?? "Avatar"} />
              ) : (
                <AvatarFallback className="text-xs">
                  {(user.name ?? user.email)[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">
                {profile?.businessName || user.name || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {profile?.email || user.email}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="space-y-0.5 pb-2">
            <div className="text-sm font-medium">{profile?.businessName || user.name || "User"}</div>
            <div className="text-xs text-muted-foreground">{profile?.email || user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleProfileOpen}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Profile</DialogTitle>
          </DialogHeader>
          
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {profileData.logo ? (
                        <AvatarImage src={profileData.logo} alt="Business Logo" />
                      ) : (
                        <AvatarFallback>
                          <Upload className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 200x200px, PNG or JPG (Max 2MB)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={profileData.businessName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          businessName: e.target.value
                        }))}
                        placeholder="Enter your business name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        address: e.target.value
                      }))}
                      placeholder="Enter your complete business address"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsProfileOpen(false)}
              disabled={saveProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileSave}
              disabled={saveProfileMutation.isPending || isLoadingProfile}
            >
              {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
