import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Users, 
  BarChart3, 
  DollarSign, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground dark:text-white">
                InvoiceFlow
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" className="px-2 sm:px-4">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="px-2 sm:px-4">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            ✨ Modern Invoice Management
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground dark:text-white mb-6">
            Streamline Your
            <span className="text-blue-600 block">Business Invoicing</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground dark:text-gray-300 mb-8 max-w-3xl mx-auto px-4">
            Create professional invoices, manage clients, track expenses, and analyze your business 
            performance with our comprehensive invoice management platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4">
            No credit card required • Free 30-day trial
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
              From invoice creation to financial reporting, InvoiceFlow provides all the tools 
              you need to run your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Professional Invoices</CardTitle>
                <CardDescription>
                  Create beautiful, professional invoices with customizable templates and automatic calculations.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                  Organize and manage all your client information in one central location with easy search and filtering.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Get insights into your business performance with detailed reports and analytics dashboards.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle>Expense Tracking</CardTitle>
                <CardDescription>
                  Track business expenses and bills with categorization and recurring payment management.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  Get instant updates on invoice status, payments, and important business metrics.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Your data is protected with enterprise-grade security and automatic backups.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-6">
                Why Choose InvoiceFlow?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white mb-2">Save Time</h3>
                    <p className="text-muted-foreground dark:text-gray-300">
                      Automate your invoicing process and reduce manual work by up to 80%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white mb-2">Get Paid Faster</h3>
                    <p className="text-muted-foreground dark:text-gray-300">
                      Professional invoices and automated reminders help you get paid 40% faster.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white mb-2">Stay Organized</h3>
                    <p className="text-muted-foreground dark:text-gray-300">
                      Keep all your business data organized and accessible from anywhere.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white mb-2">Make Better Decisions</h3>
                    <p className="text-muted-foreground dark:text-gray-300">
                      Use detailed analytics and reports to make informed business decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Ready in Minutes</CardTitle>
                  <CardDescription>
                    Get started with InvoiceFlow in just a few simple steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-foreground dark:text-gray-300">Sign up for your free account</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-foreground dark:text-gray-300">Add your clients and services</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-foreground dark:text-gray-300">Create and send your first invoice</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using InvoiceFlow to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 mt-6 text-blue-100">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="text-sm">Trusted by 10,000+ businesses</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                InvoiceFlow
              </span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground">
              <Link href="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="hover:text-white transition-colors">
                Get Started
              </Link>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
