"use client";
import Link from 'next/link'
import Button from '@/components/common/Button'
import Footer from '@/components/common/Footer'


export default function SuccessModalStep() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
					<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Enrolled!</h2>
					<p className="text-gray-600 mb-8">Login to check your Enrollment status</p>
					<Link href="/login">
						<Button fullWidth>
							Login
						</Button>
					</Link>
				</div>
				<Footer />
			</div>
    </div>
  )
}