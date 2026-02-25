window.guideHTML = `
	<div id="page-guide" class="app-page pb-20">
		<!-- ปกคู่มือ -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-10 mb-12 shadow-2xl">
			<div class="absolute inset-0 bg-black opacity-10"></div>
			<div class="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl"></div>
			
			<div class="relative z-10 flex flex-col items-center text-center">
				<button class="speak-btn absolute top-0 right-0 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors" 
					data-speak="ยินดีต้อนรับสู่คู่มือการใช้งาน Finance Manager Pro เวอร์ชัน ${APP_VERSION} อัปเดตล่าสุด ${APP_LAST_UPDATED_TH} คู่มือนี้จะแนะนำคุณเกี่ยวกับระบบจัดการรายรับรายจ่ายอย่างละเอียด ประกอบด้วย 8 หัวข้อหลัก ได้แก่ เริ่มต้นใช้งาน, หน้าแรกศูนย์ควบคุม, รายการและวิเคราะห์เชิงลึก, ปฏิทินการเงิน, จัดการบัญชีและหมวดหมู่, ตั้งค่าและจัดการข้อมูล, ฟีเจอร์อัจฉริยะพิเศษ และการแก้ไขปัญหาเบื้องต้น คุณสามารถกดปุ่มลำโพงตามหัวข้อต่างๆ เพื่อฟังคำอธิบายเพิ่มเติมได้">
					<i class="fa-solid fa-volume-high text-xl"></i>
				</button>
				<div class="w-28 h-28 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/30">
					<i class="fa-solid fa-book-open text-6xl text-white drop-shadow-lg"></i>
				</div>
				<h1 class="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-2xl">คู่มือการใช้งาน</h1>
				<p class="text-2xl md:text-3xl font-light mb-2 max-w-2xl opacity-90">Finance Manager Pro</p>
				<p class="text-xl font-medium mb-2 max-w-2xl">ระบบจัดการรายรับ‑รายจ่าย</p>
				<p class="text-xl font-medium flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full shadow-inner">
					ฉบับสมบูรณ์
				</p>
				<p class="mt-6 text-lg opacity-80 flex items-center">
				<i class="fa-regular fa-circle-check mr-2"></i> เวอร์ชัน ${APP_VERSION}
				<i class="fa-regular fa-calendar ml-4 mr-2"></i>  อัปเดตล่าสุด ${APP_LAST_UPDATED_TH}</span>
				</p>
			</div>
		</div>

		<!-- สารบัญ -->
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-12 border border-gray-100 dark:border-gray-700 transition-colors">
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-3">
					<i class="fa-solid fa-list-ul text-3xl text-purple-600"></i>
					สารบัญ
				</h2>
				<button class="speak-btn bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800 p-3 rounded-full transition-colors" 
					data-speak="สารบัญมีทั้งหมด 8 หัวข้อ คุณสามารถกดที่ลิงก์เพื่อเลื่อนไปยังส่วนนั้น ๆ หรือกดปุ่มลำโพงเพื่อฟังคำอธิบายแต่ละหัวข้อได้ หัวข้อได้แก่: เริ่มต้นใช้งาน (การติดตั้ง PWA, รหัสผ่านเริ่มต้น, Biometric), หน้าแรกศูนย์ควบคุม (การ์ดสรุป, งบประมาณ, บัญชีทั้งหมด, ปุ่มเพิ่มรายการด่วน, กราฟ), รายการและวิเคราะห์เชิงลึก (ตัวกรองขั้นสูง, สรุปยอดไดนามิก, กราฟหมวดหมู่และแนวโน้ม, การจัดการรายการ), ปฏิทินการเงิน (แสดงวันหยุด วันพระ ยอดเงิน คลิกวันที่เพื่อดูสรุป), จัดการบัญชีและหมวดหมู่ (เพิ่ม/แก้ไข/เรียงบัญชี, เปลี่ยนไอคอน, ซ่อน/แสดง, ปรับปรุงยอด, จัดการหมวดหมู่, รายการที่ใช้บ่อย, รายการประจำ, งบประมาณ), ตั้งค่าและจัดการข้อมูล (ทั่วไป, ความปลอดภัย, LINE Notify, จัดการข้อมูล), ฟีเจอร์อัจฉริยะพิเศษ (สั่งงานด้วยเสียง, สแกนใบเสร็จ, เครื่องคิดเลข, ผู้ช่วยอัจฉริยะ), แก้ไขปัญหาเบื้องต้น">
					<i class="fa-solid fa-volume-high text-purple-600 dark:text-purple-400"></i>
				</button>
			</div>
			
			<!-- ลิงก์สารบัญ (เหมือนเดิมทุกประการ) -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<a href="#start" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-rocket"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">เริ่มต้นใช้งาน</span>
				</a>
				<a href="#dashboard" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-chart-pie"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">หน้าแรก – ศูนย์ควบคุม</span>
				</a>
				<a href="#list" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-table"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">รายการและวิเคราะห์เชิงลึก</span>
				</a>
				<a href="#calendar" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-calendar-days"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">ปฏิทินการเงิน</span>
				</a>
				<a href="#accounts" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-wallet"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">จัดการบัญชีและหมวดหมู่</span>
				</a>
				<a href="#settings" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-slate-100 dark:bg-slate-900/40 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-gear"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">ตั้งค่าและจัดการข้อมูล</span>
				</a>
				<a href="#smart" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-robot"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">ฟีเจอร์อัจฉริยะพิเศษ</span>
				</a>
				<a href="#trouble" class="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-800 toc-link">
					<div class="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl group-hover:scale-110 transition">
						<i class="fa-solid fa-circle-question"></i>
					</div>
					<span class="font-bold text-gray-800 dark:text-gray-200 text-lg">แก้ไขปัญหาเบื้องต้น</span>
				</a>
			</div>
		</div>

		<!-- เนื้อหาแต่ละส่วน -->
		<div class="space-y-12">

			<!-- 1. เริ่มต้นใช้งาน -->
			<section id="start" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-rocket"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">เริ่มต้นใช้งาน</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หัวข้อเริ่มต้นใช้งาน อธิบายวิธีการติดตั้งแอปพลิเคชันในรูปแบบ PWA ทั้งบน Android และ iPhone, การตั้งรหัสผ่านเริ่มต้นคือ 1234 พร้อมคำแนะนำให้เปลี่ยนทันที, และการเปิดใช้งาน Biometric หรือสแกนนิ้วใบหน้าเพื่อความสะดวกและปลอดภัยในการเข้าใช้งาน นอกจากนี้ยังมีเคล็ดลับการใช้ Biometric ร่วมกับ Auto Lock">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- PWA -->
					<div class="flex flex-col md:flex-row gap-6 items-start relative">
						<div class="md:w-1/4 flex justify-center">
							<div class="w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-3xl flex items-center justify-center text-5xl text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800">
								<i class="fa-solid fa-mobile-screen-button"></i>
							</div>
						</div>
						<div class="md:w-3/4">
							<h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
								<i class="fa-solid fa-download text-purple-600"></i> 
								ติดตั้งแอปพลิเคชัน (PWA)
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="การติดตั้งแอปพลิเคชันแบบ PWA ช่วยให้คุณสามารถใช้งานระบบได้เหมือนแอปทั่วไป ติดตั้งง่ายโดยไม่ต้องผ่าน App Store หรือ Play Store สำหรับ Android ให้เปิดเว็บด้วย Chrome กดเมนูสามจุดที่มุมขวาบน แล้วเลือก 'ติดตั้งแอป' หรือ 'Add to Home screen' สำหรับ iPhone ใช้เบราว์เซอร์ Safari กดไอคอนแชร์ด้านล่าง แล้วเลือก 'เพิ่มไปยังหน้าจอโฮม' หลังจากติดตั้ง คุณจะเห็นไอคอนแอปบนหน้าจอหลัก สามารถเปิดใช้งานได้ทันทีแม้ไม่มีอินเทอร์เน็ต ข้อมูลจะถูกบันทึกในเครื่องและซิงค์เมื่อมีการเชื่อมต่อ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<ul class="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
								<li><b class="text-purple-600">Android/Chrome</b> : เปิดเว็บด้วย Chrome → กดเมนูสามจุด → “ติดตั้งแอป” หรือ “Add to Home screen”</li>
								<li><b class="text-purple-600">iPhone/Safari</b> : กดไอคอนแชร์ → “เพิ่มไปยังหน้าจอโฮม”</li>
								<li>เมื่อติดตั้งแล้ว คุณจะเห็นไอคอนแอปบนหน้าจอหลัก ใช้งานได้แม้ไม่มีอินเทอร์เน็ต</li>
							</ul>
							<button data-demo="pwa" class="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- ความปลอดภัย -->
					<div class="grid md:grid-cols-2 gap-6 mt-6">
						<!-- รหัสผ่านเริ่มต้น -->
						<div class="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl relative">
							<div class="flex items-center gap-3 mb-4">
								<div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl text-green-600">
									<i class="fa-solid fa-key"></i>
								</div>
								<h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">รหัสผ่านเริ่มต้น
									<button class="speak-btn ml-2 text-green-600 hover:text-green-800 dark:text-green-400" 
										data-speak="รหัสผ่านเริ่มต้นของระบบคือ 1234 เพื่อความปลอดภัยคุณควรเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบครั้งแรก โดยไปที่เมนูตั้งค่า เลือก 'จัดการรหัสผ่าน' และตั้งรหัสผ่านใหม่ที่จำง่ายและปลอดภัย การเปลี่ยนรหัสผ่านจะช่วยป้องกันผู้อื่นเข้าถึงข้อมูลการเงินของคุณ">
										<i class="fa-solid fa-volume-high"></i>
									</button>
								</h4>
							</div>
							<p class="text-gray-600 dark:text-gray-400 text-lg">รหัสเริ่มต้นคือ <span class="font-mono bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg text-purple-700 dark:text-purple-400">1234</span> ควรเปลี่ยนทันทีที่เข้าสู่ระบบครั้งแรก</p>
							<button data-demo="password" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs shadow border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
						<!-- Biometric -->
						<div class="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl relative">
							<div class="flex items-center gap-3 mb-4">
								<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl text-blue-600">
									<i class="fa-solid fa-fingerprint"></i>
								</div>
								<h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">Biometric
									<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
										data-speak="Biometric หรือการสแกนลายนิ้วมือและใบหน้า เป็นอีกวิธีในการยืนยันตัวตนที่สะดวกและรวดเร็ว หากอุปกรณ์ของคุณมีเซ็นเซอร์สแกนนิ้วหรือรองรับ Face ID คุณสามารถเปิดใช้งานได้ที่เมนูตั้งค่า เลือก 'Biometric' และทำตามขั้นตอนการลงทะเบียน เมื่อเปิดใช้งานแล้ว คุณจะสามารถปลดล็อคแอปและยืนยันการทำรายการต่าง ๆ ด้วยนิ้วหรือใบหน้าแทนการพิมพ์รหัสผ่าน">
										<i class="fa-solid fa-volume-high"></i>
									</button>
								</h4>
							</div>
							<p class="text-gray-600 dark:text-gray-400 text-lg">หากอุปกรณ์รองรับ สามารถเปิดใช้งานสแกนนิ้ว/ใบหน้าแทนรหัสผ่านได้ที่ <span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400">ตั้งค่า → Biometric</span></p>
							<button data-demo="biometric" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- เคล็ดลับ -->
					<div class="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-xl border-l-8 border-yellow-400 dark:border-yellow-600">
						<p class="text-yellow-800 dark:text-yellow-200 text-lg flex items-start gap-3">
							<i class="fa-solid fa-lightbulb text-2xl flex-shrink-0"></i>
							<span><b class="font-bold">เคล็ดลับ :</b> ใช้ Biometric ร่วมกับ Auto‑lock (ตั้งค่าเวลา) เพื่อความปลอดภัยและสะดวกในการเข้าใช้งาน</span>
							<button class="speak-btn ml-2 text-yellow-700 hover:text-yellow-800 dark:text-yellow-400" 
								data-speak="เคล็ดลับ: หากคุณเปิดใช้งาน Biometric และตั้งค่า Auto Lock ในเมนูความปลอดภัย ระบบจะล็อกหน้าจออัตโนมัติเมื่อไม่มีกิจกรรมตามเวลาที่กำหนด และเมื่อกลับมาใช้งานคุณสามารถปลดล็อคด้วยนิ้วหรือใบหน้าได้ทันที ทำให้ทั้งปลอดภัยและสะดวก ไม่ต้องพิมพ์รหัสผ่านบ่อยบ่อย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</p>
					</div>
				</div>
			</section>

			<!-- 2. หน้าแรก – ศูนย์ควบคุม -->
			<section id="dashboard" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-chart-pie"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">หน้าแรก – ศูนย์ควบคุมการเงิน</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หน้าแรกเป็นศูนย์รวมข้อมูลทางการเงินของคุณ ประกอบด้วยการ์ดสรุปยอดรายรับ รายจ่าย และคงเหลือ, งบประมาณรายเดือน, สรุปบัญชีทั้งหมด, ปุ่มเพิ่มรายการด่วน, กราฟแสดงสัดส่วนและรายจ่ายสูงสุด รวมถึงรายการธุรกรรมล่าสุด คุณสามารถคลิกที่การ์ดหรือปุ่มต่าง ๆ เพื่อดูรายละเอียดเพิ่มเติมหรือเพิ่มข้อมูลใหม่">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- การ์ดสรุป -->
					<div class="grid md:grid-cols-3 gap-4">
						<!-- รายรับ -->
						<div onclick="handleSummaryCardClick('income')" class="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition relative">
							<div class="flex items-center gap-3 mb-2">
								<i class="fa-solid fa-arrow-down text-2xl text-green-600"></i>
								<span class="font-bold text-green-800 dark:text-green-400 text-xl">รายรับ</span>
							</div>
							<p class="text-2xl font-bold text-green-700 dark:text-green-300">฿0.00</p>
							<p class="text-sm text-green-600 dark:text-green-400 mt-1">คลิกเพื่อดูเฉพาะรายรับ</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs shadow border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-gray-600 transition" 
								data-speak="การ์ดสรุปรายรับ แสดงยอดรวมรายรับทั้งหมดในช่วงเวลาที่เลือก (เดือนนี้ หรือปีนี้) หากคุณคลิกที่การ์ดนี้ ระบบจะพาคุณไปที่หน้ารายการพร้อมกรองเฉพาะรายการที่เป็นรายรับโดยอัตโนมัติ เพื่อให้คุณดูรายละเอียดหรือแก้ไขได้"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<!-- รายจ่าย -->
						<div onclick="handleSummaryCardClick('expense')" class="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition relative">
							<div class="flex items-center gap-3 mb-2">
								<i class="fa-solid fa-arrow-up text-2xl text-red-600"></i>
								<span class="font-bold text-red-800 dark:text-red-400 text-xl">รายจ่าย</span>
							</div>
							<p class="text-2xl font-bold text-red-700 dark:text-red-300">฿0.00</p>
							<p class="text-sm text-red-600 dark:text-red-400 mt-1">คลิกเพื่อดูเฉพาะรายจ่าย</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs shadow border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-gray-600 transition" 
								data-speak="การ์ดสรุปรายจ่าย แสดงยอดรวมรายจ่ายทั้งหมดในช่วงเวลาที่เลือก (เดือนนี้ หรือปีนี้) หากคุณคลิกที่การ์ดนี้ ระบบจะพาคุณไปที่หน้ารายการพร้อมกรองเฉพาะรายการที่เป็นรายจ่ายโดยอัตโนมัติ เพื่อให้คุณดูรายละเอียดหรือแก้ไขได้"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<!-- คงเหลือ -->
						<div onclick="handleSummaryCardClick('all')" class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition relative">
							<div class="flex items-center gap-3 mb-2">
								<i class="fa-solid fa-wallet text-2xl text-blue-600"></i>
								<span class="font-bold text-blue-800 dark:text-blue-400 text-xl">คงเหลือ</span>
							</div>
							<p class="text-2xl font-bold text-blue-700 dark:text-blue-300">฿0.00</p>
							<p class="text-sm text-blue-600 dark:text-blue-400 mt-1">คลิกเพื่อดูทั้งหมด</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition" 
								data-speak="การ์ดสรุปคงเหลือ แสดงยอดเงินคงเหลือทั้งหมดของบัญชีประเภทเงินสด/ออมทรัพย์ (ไม่รวมบัตรเครดิตหรือหนี้สิน) หากคุณคลิกที่การ์ดนี้ ระบบจะพาคุณไปที่หน้ารายการโดยไม่มีการกรองประเภท เพื่อให้คุณเห็นธุรกรรมทั้งหมด"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
					</div>

					<!-- งบประมาณ -->
					<div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-lg transition relative">
						<h3 class="text-xl font-bold text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2">
							<i class="fa-solid fa-bullseye"></i> งบประมาณรายจ่าย (เดือนนี้)
							<button class="speak-btn ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400" 
								data-speak="ส่วนแสดงงบประมาณรายจ่ายของเดือนปัจจุบัน คุณสามารถตั้งวงเงินงบประมาณสำหรับแต่ละหมวดหมู่ได้ที่หน้า 'บัญชี' จากนั้นหน้าแรกจะแสดงสถานะการใช้จ่ายเทียบกับวงเงินที่ตั้งไว้ พร้อมแถบเปอร์เซ็นต์และคำแนะนำ หากคลิกที่หมวดหมู่ใด ระบบจะพาคุณไปที่หน้ารายการพร้อมกรองเฉพาะหมวดหมู่นั้นในเดือนปัจจุบัน">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</h3>
						<p class="text-gray-700 dark:text-gray-300">แสดงสถานะการใช้จ่ายเทียบกับวงเงินที่ตั้งไว้ คลิกที่หมวดหมู่เพื่อดูรายการเจาะลึก</p>
						<button data-demo="budget" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs shadow border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>

					<!-- บัญชีทั้งหมด -->
					<div class="grid md:grid-cols-2 gap-6">
						<div class="cursor-pointer hover:shadow-lg transition relative">
							<h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
								<i class="fa-solid fa-layer-group text-purple-600"></i> บัญชีทั้งหมด (ภาพรวม)
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="ส่วนสรุปบัญชีทั้งหมดจะแสดงการ์ดของแต่ละบัญชีที่คุณสร้างไว้ พร้อมยอดคงเหลือปัจจุบัน คุณสามารถคลิกสั้น ๆ ที่การ์ดเพื่อดูประวัติธุรกรรมของบัญชีนั้น หรือหากกดค้างไว้ประมาณ 0.8 วินาที ระบบจะให้คุณดาวน์โหลดรายการเคลื่อนไหวของบัญชีนั้นในรูปแบบ Excel">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p class="text-gray-600 dark:text-gray-400">คลิกสั้นที่การ์ดเพื่อดูประวัติบัญชีนั้น กดค้างเพื่อส่งออก Excel</p>
							<button data-demo="accountsSummary" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
						<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
							<p class="text-sm text-purple-700 dark:text-purple-300"><i class="fa-regular fa-clock mr-1"></i> การกดค้าง (Long press) 0.8 วินาที</p>
						</div>
					</div>

					<!-- ปุ่มเพิ่มรายการด่วน -->
					<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div onclick="openModal()" class="bg-purple-600 text-white p-4 rounded-xl text-center shadow-lg cursor-pointer hover:bg-purple-700 transition relative">
							<i class="fa-solid fa-plus text-3xl mb-2"></i>
							<div class="font-bold">เพิ่มธุรกรรมใหม่</div>
							<button class="speak-btn absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 w-8 h-8 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ปุ่มเพิ่มธุรกรรมใหม่ เมื่อคลิกจะเปิดฟอร์มให้คุณกรอกรายละเอียดของรายการ ไม่ว่าจะเป็นรายรับ รายจ่าย หรือโอนย้าย คุณสามารถระบุชื่อรายการ หมวดหมู่ จำนวนเงิน วันที่ และแนบรูปใบเสร็จได้ ระบบจะจำชื่อรายการและหมวดหมู่ที่ใช้บ่อยเพื่อความสะดวกในการกรอกครั้งต่อไป"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div onclick="triggerReceiptUpload()" class="bg-teal-500 text-white p-4 rounded-xl text-center shadow-lg cursor-pointer hover:bg-teal-600 transition relative">
							<i class="fa-solid fa-image text-3xl mb-2"></i>
							<div class="font-bold">เพิ่มด้วยรูปภาพ</div>
							<button class="speak-btn absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 w-8 h-8 rounded-full text-xs shadow border border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ปุ่มเพิ่มด้วยรูปภาพ ใช้สำหรับสแกนใบเสร็จหรือสลิปโอนเงิน เมื่อคลิกคุณสามารถเลือกรูปภาพจากแกลเลอรีหรือถ่ายรูปใหม่ ระบบ OCR จะอ่านข้อความในรูป เช่น วันที่ เวลา ยอดเงิน และชื่อผู้รับ แล้วกรอกข้อมูลลงในฟอร์มให้โดยอัตโนมัติ พร้อมแนบรูปที่บีบอัดแล้วไว้กับรายการ"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div onclick="startVoiceRecognition()" class="bg-blue-500 text-white p-4 rounded-xl text-center shadow-lg cursor-pointer hover:bg-blue-600 transition relative">
							<i class="fa-solid fa-microphone text-3xl mb-2"></i>
							<div class="font-bold">เพิ่มด้วยเสียง</div>
							<button class="speak-btn absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ปุ่มเพิ่มด้วยเสียง เมื่อคลิกคุณสามารถพูดคำสั่งเพื่อบันทึกรายการได้ เช่น 'จ่ายค่ากาแฟ 60 บาท' หรือ 'ได้เงินเดือน 15,000 บาท' ระบบจะจดจำและนำข้อมูลไปกรอกในฟอร์ม จากนั้นคุณสามารถตรวจสอบและกดบันทึกได้ สะดวกเมื่อคุณไม่สะดวกพิมพ์"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div onclick="openQuickDraftModal()" class="bg-yellow-500 text-white p-4 rounded-xl text-center shadow-lg cursor-pointer hover:bg-yellow-600 transition relative">
							<i class="fa-solid fa-bolt text-3xl mb-2"></i>
							<div class="font-bold">จดด่วน (Draft)</div>
							<button class="speak-btn absolute -top-2 -right-2 bg-white dark:bg-gray-700 text-yellow-600 dark:text-yellow-400 w-8 h-8 rounded-full text-xs shadow border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ปุ่มจดด่วน ใช้สำหรับบันทึกจำนวนเงินและโน้ตสั้น ๆ ไว้ก่อน โดยไม่ต้องกรอกรายละเอียดครบถ้วน เช่น เมื่อคุณรีบแต่ต้องการจดไว้ว่าใช้เงินไปเท่าไหร่ ระบบจะบันทึกเป็นรายการร่าง และแสดงที่หน้าแรก เมื่อคลิกที่รายการร่าง คุณสามารถเพิ่มรายละเอียดเพิ่มเติมและบันทึกเป็นธุรกรรมจริงได้"
								title="ฟังคำอธิบาย">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
					</div>

					<!-- กราฟ -->
					<div class="grid md:grid-cols-2 gap-6">
						<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl relative">
							<p class="font-semibold text-center mb-2">สัดส่วน รายรับ vs รายจ่าย</p>
							<img src="images/chart-pie-sample.png" alt="กราฟแสดงสัดส่วนรายรับรายจ่าย" class="w-full h-40 object-contain rounded-lg shadow-md">
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition" 
								data-speak="กราฟวงกลมแสดงสัดส่วนระหว่างรายรับและรายจ่ายในช่วงเวลาที่เลือก (เดือนนี้ หรือปีนี้) หากกราฟไม่มีข้อมูลจะขึ้นข้อความว่าไม่มีข้อมูล คุณสามารถดูตัวเลขเปรียบเทียบได้ง่าย ๆ จากขนาดของวงกลม">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl relative">
							<p class="font-semibold text-center mb-2">Top 10 รายจ่าย</p>
							<img src="images/chart-bar-sample.png" alt="กราฟแสดงรายจ่ายสูงสุด 10 อันดับ" class="w-full h-40 object-contain rounded-lg shadow-md">
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition" 
								data-speak="กราฟแสดง 10 รายการที่คุณใช้จ่ายสูงสุดในช่วงเวลาที่เลือก โดยจะแสดงชื่อรายการและจำนวนเงิน หากมีรายการมากกว่า 10 รายการ รายการที่เหลือจะถูกรวมเป็น 'อื่นๆ' เพื่อให้กราฟไม่รกเกินไป">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
					</div>
					<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
						<p class="flex items-center gap-2 text-blue-800 dark:text-blue-300">
							<i class="fa-solid fa-list-check"></i> รายการธุรกรรมล่าสุด พร้อมฟิลเตอร์ (ทั้งหมด/รายรับ/รายจ่าย/โอนย้าย)
							<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
								data-speak="ส่วนท้ายของหน้าแรกจะแสดงรายการธุรกรรมล่าสุด 10 หรือ 20 รายการตามที่คุณเลือก มีปุ่มกรองให้คุณดูเฉพาะรายรับ รายจ่าย หรือโอนย้ายได้ คุณยังสามารถเปลี่ยนจำนวนรายการต่อหน้าได้จาก dropdown ด้านบน">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</p>
					</div>
				</div>
			</section>

			<!-- 3. หน้ารายการและวิเคราะห์เชิงลึก -->
			<section id="list" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-magnifying-glass-chart"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">รายการและวิเคราะห์เชิงลึก</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หน้ารายการมีเครื่องมือวิเคราะห์ที่ทรงพลัง คุณสามารถกรองข้อมูลตามช่วงวันที่ ประเภท และคำค้นหาได้อย่างละเอียด มีสรุปยอดแบบไดนามิกที่อัปเดตตามผลการกรอง พร้อมกราฟโดนัทแสดงสัดส่วนหมวดหมู่รายจ่าย และกราฟแท่งแนวโน้มรายวันของ 7 วันล่าสุด นอกจากนี้ยังสามารถจัดการรายการได้ทันที">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- ตัวกรองขั้นสูง -->
					<div class="grid md:grid-cols-2 gap-6">
						<div class="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl relative">
							<h3 class="font-bold text-lg mb-3 flex items-center gap-2">
								<i class="fa-solid fa-filter"></i> ตัวกรองขั้นสูง
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="ตัวกรองขั้นสูงช่วยให้คุณค้นหารายการได้ตรงตามต้องการ คุณสามารถเลือกช่วงวันที่เริ่มต้นและสิ้นสุด เลือกประเภท (ทั้งหมด, รายรับ, รายจ่าย, โอนย้าย) และพิมพ์คำค้นหาเพื่อค้นหาจากชื่อรายการ หมวดหมู่ หมายเหตุ หรือชื่อบัญชี ผลการค้นหาจะอัปเดตทันที">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<ul class="space-y-2 text-gray-600 dark:text-gray-300">
								<li><span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400">ช่วงวันที่</span> เริ่มต้น-สิ้นสุด</li>
								<li><span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400">ประเภท</span> ทั้งหมด/รายรับ/รายจ่าย/โอนย้าย</li>
								<li><span class="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400">ค้นหา</span> ชื่อรายการ, หมวดหมู่, หมายเหตุ, บัญชี</li>
							</ul>
							<button data-demo="chart-list" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl">
							<h3 class="font-bold text-lg mb-3 flex items-center gap-2">
								<i class="fa-solid fa-chart-line"></i> สรุปยอดแบบไดนามิก
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="ด้านล่างตัวกรองคุณจะเห็นสรุปยอดแบบไดนามิกที่คำนวณจากรายการที่กำลังแสดงอยู่ ประกอบด้วยยอดรวมรายรับ ยอดรวมรายจ่าย และยอดสุทธิ (รายรับลบรายจ่าย) โดยมีสีตามสถานะ สีเขียวหมายถึงสุทธิบวก สีแดงหมายถึงติดลบ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>แสดงยอดรวมรายรับ รายจ่าย และสุทธิ ของรายการที่กรองอยู่ พร้อมสีตามสถานะ</p>
						</div>
					</div>
					<!-- กราฟวิเคราะห์ -->
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<div class="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 p-4 rounded-xl relative">
								<p class="font-bold mb-2"><i class="fa-solid fa-chart-pie text-purple-600"></i> หมวดหมู่ (โดนัท)
									<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
										data-speak="กราฟโดนัทแสดงสัดส่วนของรายจ่ายตามหมวดหมู่ โดยจะแสดงเฉพาะ 5 หมวดหมู่ที่มียอดสูงสุด ที่เหลือจะรวมเป็น 'อื่นๆ' เพื่อให้เห็นภาพรวมง่ายขึ้น เมื่อวางเมาส์บนกราฟจะเห็นจำนวนเงิน">
										<i class="fa-solid fa-volume-high"></i>
									</button>
								</p>
								<img src="images/chart-doughnut-sample.png" alt="กราฟแสดงสัดส่วนตามหมวดหมู่" class="w-full h-40 object-contain rounded-lg shadow-md">
								<button data-demo="chart-list" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
									<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
								</button>
							</div>
						</div>
						<div>
							<div class="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl relative">
								<p class="font-bold mb-2"><i class="fa-solid fa-chart-column text-blue-600"></i> แนวโน้มตามวัน
									<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
										data-speak="กราฟแท่งแนวโน้มรายวันแสดงยอดเงินในแต่ละวันสำหรับ 7 วันล่าสุด โดยกราฟนี้จะใช้ข้อมูลจากรายการที่คุณกรองอยู่ (ช่วงวันที่, ประเภท, คำค้นหา) เพื่อให้คุณเห็นการเปลี่ยนแปลงของยอดเงินรายวันได้">
										<i class="fa-solid fa-volume-high"></i>
									</button>
								</p>
								<img src="images/chart-trend-sample.png" alt="กราฟแสดงแนวโน้มรายจ่ายตามวัน" class="w-full h-40 object-contain rounded-lg shadow-md">
								<button data-demo="chart-list" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
									<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
								</button>
							</div>
						</div>
					</div>
					<!-- จัดการรายการ -->
					<div class="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
						<h3 class="font-bold text-lg text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
							<i class="fa-solid fa-pen-to-square"></i> การจัดการรายการ
							<button class="speak-btn ml-2 text-amber-600 hover:text-amber-800 dark:text-amber-400" 
								data-speak="ในหน้ารายการ คุณสามารถจัดการกับธุรกรรมแต่ละรายการได้โดยคลิกที่ปุ่มต่าง ๆ ในคอลัมน์จัดการ: ปุ่มดินสอใช้แก้ไขรายการ, ปุ่มถังขยะใช้ลบรายการ (ทั้งสองต้องยืนยันรหัสผ่าน), และไอคอนใบเสร็จใช้ดูรูปใบเสร็จที่แนบไว้ (สามารถซูมและแพนรูปได้)">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</h3>
						<p class="text-gray-700 dark:text-gray-300">กดที่ปุ่มดินสอเพื่อแก้ไข, ถังขยะเพื่อลบ (ต้องยืนยันรหัสผ่าน) และไอคอนใบเสร็จเพื่อดูรูปขยาย (ซูม/แพนได้)</p>
						<button data-demo="itemManage" class="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
					<p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><i class="fa-regular fa-gem"></i> รองรับการจัดกลุ่มตามวัน/เดือน เพื่อดูสรุปยอดแต่ละช่วง</p>
				</div>
			</section>

			<!-- 4. ปฏิทินการเงิน -->
			<section id="calendar" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-amber-500 to-orange-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-calendar-days"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">ปฏิทินการเงิน</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หน้าปฏิทินการเงินแสดงภาพรวมของธุรกรรมในแต่ละวัน คุณสามารถเลือกแสดงวันหยุด วันพระ และยอดเงินรายวันได้ด้วยสวิตช์ด้านบน แต่ละวันที่มีรายการจะแสดงตัวเลข + (รายรับ) หรือ - (รายจ่าย) กำกับไว้ หากคลิกที่วันใด ระบบจะแสดงสรุปรายการของวันนั้นและมีปุ่มให้เพิ่มรายการหรือแจ้งเตือนพิเศษ">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- ตัวเลือกการแสดงผล (สวิตช์ทำงานจริง) -->
					<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
						<h3 class="font-bold text-gray-700 dark:text-gray-300 mb-3"><i class="fa-solid fa-layer-group mr-2"></i>ตัวเลือกการแสดงผล</h3>
						<div class="flex flex-wrap gap-4">
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" id="demo-cal-toggle-holiday" class="sr-only peer" checked>
								<div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
								<span class="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">วันหยุด</span>
							</label>
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" id="demo-cal-toggle-buddhist" class="sr-only peer" checked>
								<div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
								<span class="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">วันพระ</span>
							</label>
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" id="demo-cal-toggle-money" class="sr-only peer" checked>
								<div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
								<span class="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">ยอดเงิน</span>
							</label>
						</div>
					</div>

					<!-- ตัวอย่างปฏิทิน (static แต่ปรับตามสวิตช์ได้) -->
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
						<div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
							<span class="text-lg font-bold text-gray-800 dark:text-gray-200">มีนาคม 2026</span>
							<span class="text-sm text-gray-500">ตัวอย่างการแสดงผล</span>
						</div>
						<div class="p-4 overflow-x-auto">
							<table class="w-full text-sm min-w-[500px]">
								<thead>
									<tr class="bg-gray-100 dark:bg-gray-700">
										<th class="p-2 text-center font-medium">อา</th>
										<th class="p-2 text-center font-medium">จ</th>
										<th class="p-2 text-center font-medium">อ</th>
										<th class="p-2 text-center font-medium">พ</th>
										<th class="p-2 text-center font-medium">พฤ</th>
										<th class="p-2 text-center font-medium">ศ</th>
										<th class="p-2 text-center font-medium">ส</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">1</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">2</td>
										<td data-holiday="true" data-buddhist="true" class="p-2 text-center border border-gray-100 dark:border-gray-700 bg-red-100 dark:bg-red-900/30">
											<span class="font-medium">3</span>
											<div class="holiday-label text-[10px] text-red-600 dark:text-red-400 font-bold">วันมาฆบูชา</div>
											<div class="buddhist-label text-[10px] text-yellow-700 dark:text-yellow-400">🙏 วันพระ</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">4</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">5</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">6</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">7</td>
									</tr>
									<tr>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">8</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">9</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">10</td>
										<td data-buddhist="true" class="p-2 text-center border border-gray-100 dark:border-gray-700 bg-yellow-100 dark:bg-yellow-900/30">
											<span class="font-medium">11</span>
											<div class="buddhist-label text-[10px] text-yellow-700 dark:text-yellow-400">🙏 วันพระ</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">12</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">13</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">14</td>
									</tr>
									<tr>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">15</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">16</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">17</td>
										<td data-buddhist="true" class="p-2 text-center border border-gray-100 dark:border-gray-700 bg-yellow-100 dark:bg-yellow-900/30">
											<span class="font-medium">18</span>
											<div class="buddhist-label text-[10px] text-yellow-700 dark:text-yellow-400">🙏 วันพระ</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">19</td>
										<td data-income="true" class="p-2 text-center border border-gray-100 dark:border-gray-700">
											<span class="font-medium">20</span>
											<div class="money-label income text-[10px] text-green-600">+1,200</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">21</td>
									</tr>
									<tr>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">22</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">23</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">24</td>
										<td data-expense="true" class="p-2 text-center border border-gray-100 dark:border-gray-700">
											<span class="font-medium">25</span>
											<div class="money-label expense text-[10px] text-red-600">-300</div>
										</td>
										<td data-buddhist="true" data-expense="true" class="p-2 text-center border border-gray-100 dark:border-gray-700 bg-yellow-100 dark:bg-yellow-900/30">
											<span class="font-medium">26</span>
											<div class="buddhist-label text-[10px] text-yellow-700 dark:text-yellow-400">🙏 วันพระ</div>
											<div class="money-label expense text-[10px] text-red-600">-150</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">27</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">28</td>
									</tr>
									<tr>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">29</td>
										<td data-expense="true" class="p-2 text-center border border-gray-100 dark:border-gray-700">
											<span class="font-medium">30</span>
											<div class="money-label expense text-[10px] text-red-600">-150</div>
										</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700">31</td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700"></td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700"></td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700"></td>
										<td class="p-2 text-center border border-gray-100 dark:border-gray-700"></td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex flex-wrap gap-4 justify-center">
							<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-red-500"></span> วันหยุด</span>
							<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-yellow-400"></span> วันพระ</span>
							<span class="flex items-center gap-1"><span class="text-green-600">+</span> รายรับ</span>
							<span class="flex items-center gap-1"><span class="text-red-600">-</span> รายจ่าย</span>
						</div>
					</div>

					<!-- คำอธิบายเพิ่มเติม -->
					<div class="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800">
						<p class="flex items-start gap-3 text-indigo-800 dark:text-indigo-300">
							<i class="fa-regular fa-hand-point-up text-2xl"></i>
							<span>ในหน้าต่างสรุปวันที่ มีปุ่ม “เพิ่มรายรับ-รายจ่าย” และ “เพิ่มแจ้งเตือน” เพื่อความสะดวกในการบันทึกข้อมูลย้อนหลังหรือวางแผนล่วงหน้า</span>
							<button class="speak-btn ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400" 
								data-speak="เมื่อคุณคลิกที่วันใดวันหนึ่งในปฏิทิน จะมีหน้าต่างสรุปแสดงรายการธุรกรรมและการแจ้งเตือนของวันนั้น พร้อมปุ่มให้คุณเพิ่มรายการรายรับรายจ่าย หรือเพิ่มการแจ้งเตือนพิเศษสำหรับวันนั้นได้ทันที สะดวกสำหรับการบันทึกข้อมูลย้อนหลังหรือวางแผนล่วงหน้า">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</p>
					</div>
				</div>
			</section>

			<!-- 5. จัดการบัญชีและหมวดหมู่ -->
			<section id="accounts" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-wallet"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">จัดการบัญชีและหมวดหมู่</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หน้านี้ใช้สำหรับจัดการบัญชีการเงินและหมวดหมู่รายรับรายจ่ายของคุณ คุณสามารถเพิ่ม แก้ไข ลบ จัดเรียงลำดับ เปลี่ยนไอคอน ซ่อนหรือแสดงบัญชี รวมถึงปรับปรุงยอดบัญชีได้ นอกจากนี้ยังจัดการหมวดหมู่ รายการที่ใช้บ่อย รายการประจำ และงบประมาณได้จากที่นี่">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- บัญชี -->
					<div class="grid md:grid-cols-2 gap-6">
						<div class="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl cursor-pointer hover:shadow-lg transition relative">
							<h3 class="font-bold text-xl mb-3 flex items-center gap-2">
								<i class="fa-solid fa-plus-circle text-green-600"></i> เพิ่มบัญชี
								<button class="speak-btn ml-2 text-green-600 hover:text-green-800 dark:text-green-400" 
									data-speak="คลิกที่นี่เพื่อเพิ่มบัญชีใหม่ คุณจะต้องกรอกชื่อบัญชี เลือกประเภท (เงินสด/ออมทรัพย์, บัตรเครดิต, หรือบัญชีหนี้สิน) และระบุยอดเริ่มต้น โดยสามารถใช้เครื่องคิดเลขช่วยในการคำนวณยอดได้">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>ชื่อ, ประเภท (เงินสด/บัตรเครดิต/หนี้สิน), ยอดเริ่มต้น (ใช้เครื่องคิดเลขช่วย)</p>
							<button data-demo="manageAccounts" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl cursor-pointer hover:shadow-lg transition relative">
							<h3 class="font-bold text-xl mb-3 flex items-center gap-2">
								<i class="fa-solid fa-arrows-up-down text-purple-600"></i> จัดเรียงลำดับ
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="คุณสามารถจัดเรียงลำดับบัญชีที่แสดงในหน้าแรกได้ โดยใช้ปุ่มลูกศรขึ้น/ลงที่อยู่ข้างบัญชี เพื่อให้บัญชีที่ใช้บ่อยขึ้นไปอยู่ด้านบน สะดวกต่อการมองเห็น">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>ใช้ปุ่มลูกศรขึ้น/ลง เพื่อเลื่อนบัญชีที่ใช้บ่อยขึ้นไปด้านบน</p>
							<button data-demo="manageAccounts" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<div class="grid md:grid-cols-3 gap-4">
						<div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-paintbrush text-3xl text-indigo-600 mb-2"></i>
							<p>เปลี่ยนไอคอนบัญชี</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full text-xs shadow border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="คลิกปุ่มพู่กันเพื่อเปลี่ยนไอคอนของบัญชี ระบบมีไอคอนให้เลือกมากมาย เช่น กระเป๋าเงิน, บัตรเครดิต, รถยนต์ ฯลฯ คุณสามารถค้นหาชื่อไอคอนได้ในช่องค้นหา">
								 <i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-eye-slash text-3xl text-indigo-600 mb-2"></i>
							<p>ซ่อน/แสดงบัญชี</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full text-xs shadow border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ใช้สวิตช์เปิด/ปิดข้างบัญชีเพื่อซ่อนหรือแสดงบัญชีนั้นในหน้าแรกและหน้าต่าง ๆ โดยไม่ต้องลบทิ้ง เหมาะสำหรับบัญชีที่ไม่ได้ใช้งานแต่ยังต้องการเก็บข้อมูลไว้">
								 <i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
						<div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-pencil text-3xl text-indigo-600 mb-2"></i>
							<p>ปรับปรุงยอด (ดอกเบี้ย/ค่าธรรมเนียม)</p>
							<button class="speak-btn absolute top-2 right-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full text-xs shadow border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition flex items-center justify-center" 
								data-speak="ในหน้าแก้ไขบัญชี คุณสามารถบันทึกรายการปรับปรุงยอด เช่น ดอกเบี้ยรับ หรือค่าธรรมเนียม เพื่อปรับยอดคงเหลือของบัญชีได้โดยไม่ต้องเพิ่มรายการแยก ระบบจะสร้างธุรกรรมอัตโนมัติให้">
								 <i class="fa-solid fa-volume-high"></i>
							</button>
						</div>
					</div>
					<!-- หมวดหมู่ -->
					<div class="grid md:grid-cols-2 gap-6">
						<div class="cursor-pointer hover:shadow-lg transition p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 relative">
							<h3 class="font-bold text-xl mb-3">หมวดหมู่รายรับ/รายจ่าย
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="คุณสามารถเพิ่มหรือลบหมวดหมู่สำหรับรายรับและรายจ่ายได้ตามต้องการ โดยหมวดหมู่ที่เพิ่มจะปรากฏใน dropdown ตอนเพิ่มหรือแก้ไขรายการ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>เพิ่ม/ลบหมวดหมู่ได้ตามต้องการ</p>
							<button data-demo="categories" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
						<div class="cursor-pointer hover:shadow-lg transition p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 relative">
							<h3 class="font-bold text-xl mb-3">รายการที่ใช้บ่อย (Favorite)
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="คุณสามารถเพิ่มชื่อรายการที่ใช้บ่อยได้ที่นี่ เพื่อให้เวลาพิมพ์ชื่อรายการในฟอร์ม ระบบจะแนะนำชื่อเหล่านี้ นอกจากนี้ระบบ Auto-Learn จะจดจำชื่อรายการ หมวดหมู่ และราคาล่าสุดโดยอัตโนมัติ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>เพิ่มชื่อรายการที่ใช้ประจำ และระบบ Auto‑Learn จะจำชื่อ/หมวดหมู่/ราคาล่าสุดให้อัตโนมัติ</p>
							<button data-demo="frequent" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- Recurring & Budget -->
					<div class="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl flex flex-col md:flex-row gap-4 items-start cursor-pointer hover:shadow-lg transition relative">
						<div class="w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-2xl flex items-center justify-center text-3xl text-purple-700 dark:text-purple-300">
							<i class="fa-solid fa-clock-rotate-left"></i>
						</div>
						<div>
							<h4 class="font-bold text-xl text-purple-800 dark:text-purple-400">รายการประจำ (Recurring)
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="ตั้งค่ารายการที่เกิดซ้ำ เช่น ค่าสมาชิกรายเดือน, ค่าเช่ารายเดือน, เงินเดือน ฯลฯ โดยระบุความถี่ (ทุกวัน/สัปดาห์/เดือน/ปี) และวันเริ่มต้น ระบบจะสร้างธุรกรรมให้อัตโนมัติเมื่อถึงกำหนด และอัปเดตรอบถัดไปให้">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h4>
							<p>ตั้งค่ารายการที่เกิดซ้ำ (ทุกวัน/สัปดาห์/เดือน/ปี) ระบบจะสร้างธุรกรรมให้อัตโนมัติเมื่อถึงกำหนด</p>
						</div>
						<button data-demo="recurring" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs shadow border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
					<div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl flex flex-col md:flex-row gap-4 items-start cursor-pointer hover:shadow-lg transition relative">
						<div class="w-16 h-16 bg-orange-200 dark:bg-orange-800 rounded-2xl flex items-center justify-center text-3xl text-orange-700 dark:text-orange-300">
							<i class="fa-solid fa-sack-dollar"></i>
						</div>
						<div>
							<h4 class="font-bold text-xl text-orange-800 dark:text-orange-400">ตั้งค่างบประมาณรายหมวดหมู่
								<button class="speak-btn ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400" 
									data-speak="กำหนดวงเงินงบประมาณสำหรับแต่ละหมวดหมู่รายจ่าย เมื่อกรอกข้อมูลในหน้าแรก ระบบจะแสดงสถานะการใช้จ่ายเทียบกับงบ พร้อมแถบเปอร์เซ็นต์และคำแนะนำ เช่น 'เหลือวันละ xx บาท' หรือ 'เกินงบแล้ว'">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h4>
							<p>กำหนดวงเงินสูงสุด แต่ละหมวดหมู่ หน้าแรกจะแสดงสถานะและคำแนะนำการใช้เงิน</p>
						</div>
						<button data-demo="budget" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs shadow border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
				</div>
			</section>

			<!-- 6. ตั้งค่าและจัดการข้อมูล -->
			<section id="settings" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-slate-600 to-gray-700 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-gear"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">ตั้งค่าและจัดการข้อมูล</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="หน้าตั้งค่ารวมการปรับแต่งทั่วไป เช่น ขนาดตัวอักษร, Dark Mode, การซ่อนยอดเงิน รวมถึงการตั้งค่าความปลอดภัย (รหัสผ่าน, Auto Lock, Biometric, Auto Confirm), การเชื่อมต่อ LINE Notify และการจัดการข้อมูล เช่น สำรองข้อมูล, นำเข้า, อัปเดตเวอร์ชัน, ล้างแคช, รีเซ็ตข้อมูล">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- ทั่วไป -->
					<div class="grid md:grid-cols-3 gap-4">
						<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-font text-2xl text-blue-600 mb-2"></i>
							<h4 class="font-bold">ขนาดตัวอักษร
								<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
									data-speak="เลื่อนแถบเพื่อปรับขนาดตัวอักษรของทั้งแอปพลิเคชัน มีทั้งหมด 6 ระดับ ตั้งแต่เล็กสุด ๆ ไปจนถึงใหญ่สุด ๆ เมื่อเลื่อนแล้วต้องกดปุ่ม 'บันทึก' เพื่อให้การเปลี่ยนแปลงมีผล">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h4>
							<p class="text-sm">ปรับ 6 ระดับ (เล็กสุดๆ → ใหญ่สุดๆ)</p>
							<button data-demo="settingsGeneral" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition flex items-center justify-center">
								<i class="fa-regular fa-eye"></i>
							</button>
						</div>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-moon text-2xl text-indigo-600 mb-2"></i>
							<h4 class="font-bold">Dark Mode
								<button class="speak-btn ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400" 
									data-speak="สลับการแสดงผลระหว่างโหมดสว่างและโหมดมืด เพื่อถนอมสายตาในที่แสงน้อย หรือตามความชอบส่วนตัว การเปลี่ยนแปลงจะมีผลทันที">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h4>
							<p class="text-sm">เปิด/ปิดธีมสีเข้ม</p>
							<button data-demo="settingsGeneral" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-full text-xs shadow border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-600 transition flex items-center justify-center">
								<i class="fa-regular fa-eye"></i>
							</button>
						</div>
						<div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl cursor-pointer hover:shadow-lg transition relative">
							<i class="fa-solid fa-eye-slash text-2xl text-gray-600 mb-2"></i>
							<h4 class="font-bold">ซ่อนยอดคงเหลือ
								<button class="speak-btn ml-2 text-gray-600 hover:text-gray-800 dark:text-gray-400" 
									data-speak="เมื่อเปิดใช้งาน ระบบจะซ่อนการ์ดยอดคงเหลือรวมในหน้าแรก เพื่อความเป็นส่วนตัวเวลามีคนอื่นมาเห็นหน้าจอ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h4>
							<p class="text-sm">เพื่อความเป็นส่วนตัว</p>
							<button data-demo="settingsGeneral" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 w-6 h-6 rounded-full text-xs shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center">
								<i class="fa-regular fa-eye"></i>
							</button>
						</div>
					</div>
					<!-- ความปลอดภัย -->
					<div class="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl cursor-pointer hover:shadow-lg transition relative">
						<h3 class="font-bold text-xl text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
							<i class="fa-solid fa-shield-halved"></i> ความปลอดภัย
							<button class="speak-btn ml-2 text-red-600 hover:text-red-800 dark:text-red-400" 
								data-speak="ส่วนความปลอดภัยประกอบด้วยการจัดการรหัสผ่าน (ตั้ง/เปลี่ยน/ลบ), การตั้งเวลา Auto Lock ที่จะล็อกหน้าจออัตโนมัติเมื่อไม่มีกิจกรรม, การเปิดใช้งาน Auto Confirm ที่จะยืนยันรหัสผ่านทันทีเมื่อพิมพ์ถูกต้องโดยไม่ต้องกดปุ่ม, และการตั้งค่า Biometric เพื่อใช้สแกนนิ้วหรือใบหน้าแทนรหัสผ่าน">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</h3>
						<div class="grid sm:grid-cols-2 gap-4">
							<div>🔑 จัดการรหัสผ่าน (ตั้ง/เปลี่ยน/ลบ)</div>
							<div>⏱️ Auto‑lock (1‑60 นาที)</div>
							<div>✅ Auto‑confirm (ปลดล็อคทันทีเมื่อพิมพ์ถูก)</div>
							<div>🖐️ Biometric (สแกนนิ้ว/ใบหน้า)</div>
						</div>
						<button data-demo="security" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs shadow border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
					<!-- แจ้งเตือน LINE -->
					<div class="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl cursor-pointer hover:shadow-lg transition relative">
						<h3 class="font-bold text-xl text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
							<i class="fa-brands fa-line"></i> การแจ้งเตือน LINE
							<button class="speak-btn ml-2 text-green-600 hover:text-green-800 dark:text-green-400" 
								data-speak="คุณสามารถเพิ่มผู้รับแจ้งเตือนผ่าน LINE ได้โดยกรอกชื่อเล่นและ User ID (ขึ้นต้นด้วย U) เมื่อมีการเพิ่ม แก้ไข หรือลบธุรกรรม ระบบจะส่งข้อความแจ้งเตือนไปยัง LINE ของคุณ วิธีหา User ID: แอดบอท @LINE_OA แล้วพิมพ์ 'id' ในแชท">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</h3>
						<p>เพิ่ม User ID (หาได้จากบอท @LINE_OA) เพื่อรับแจ้งเตือนเมื่อมีรายการ/แก้ไข/ลบ</p>
						<button data-demo="lineNotify" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs shadow border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
					<!-- จัดการข้อมูล -->
					<div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl cursor-pointer hover:shadow-lg transition relative">
						<h3 class="font-bold text-xl text-blue-800 dark:text-blue-400 mb-3">💾 จัดการข้อมูล
							<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
								data-speak="ส่วนนี้รวมเครื่องมือจัดการข้อมูลสำคัญ: สำรองข้อมูลเป็นไฟล์ JSON หรือ Excel, อัปโหลดขึ้น Cloud ด้วยตนเอง (Manual Sync), นำเข้าไฟล์ JSON, ใช้ Undo/Redo สำหรับย้อนกลับหรือทำซ้ำการกระทำล่าสุด, ตรวจสอบและอัปเดตเวอร์ชันเพื่อล้างแคช, และรีเซ็ตข้อมูล (เลือกเฉพาะเครื่อง, คลาวด์, หรือทั้งสอง)">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</h3>
						<ul class="list-disc list-inside space-y-1">
							<li>สำรองข้อมูล: JSON (ข้อมูลทั้งหมด), Excel (รายงานสวยงาม), Cloud Sync (Manual)</li>
							<li>นำเข้า JSON</li>
							<li>Undo/Redo สำหรับการกระทำล่าสุด</li>
							<li>อัปเดตเวอร์ชัน/ล้างแคช</li>
							<li>รีเซ็ต/ล้างข้อมูล (เลือกเฉพาะเครื่อง/cloud/ทั้งสอง)</li>
						</ul>
						<button data-demo="dataManagement" class="absolute top-2 right-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs shadow border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
				</div>
			</section>

			<!-- 7. ฟีเจอร์อัจฉริยะพิเศษ -->
			<section id="smart" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-pink-600 to-rose-600 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-robot"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">ฟีเจอร์อัจฉริยะพิเศษ</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="ฟีเจอร์อัจฉริยะช่วยให้การใช้งานสะดวกยิ่งขึ้น ประกอบด้วย การสั่งงานด้วยเสียง (มีให้ 3 แบบ), การสแกนใบเสร็จด้วย OCR เพื่อกรอกข้อมูลอัตโนมัติ, เครื่องคิดเลขในตัวขณะกรอกจำนวนเงิน, และผู้ช่วยเสียงอัจฉริยะที่เข้าใจบริบท เช่น พูด 'บันทึก' ขณะอยู่ในฟอร์มเพื่อบันทึกข้อมูล">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-6">
					<!-- สั่งงานด้วยเสียง -->
					<div class="flex flex-col md:flex-row gap-6 items-center relative">
						<div class="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-5xl text-blue-600">
							<i class="fa-solid fa-microphone-lines"></i>
						</div>
						<div>
							<h3 class="text-2xl font-bold mb-2">สั่งงานด้วยเสียง
								<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
									data-speak="ระบบรองรับการสั่งงานด้วยเสียง 3 แบบ: 1) ปุ่มไมค์หน้าแรก ใช้เพิ่มรายการด้วยเสียง 2) ปุ่มไมค์ในฟอร์มเพิ่มรายการ ใช้กรอกข้อมูลด้วยเสียงขณะกรอก และ 3) ปุ่มลอยสีฟ้า (Smart Voice) ที่มุมขวาล่างของหน้าจอ รองรับคำสั่งทั่วไป เช่น 'เปิดปฏิทิน', 'ค้นหาค่าน้ำ', 'จดด่วน 500' หรือ 'บันทึก' ขณะอยู่ในฟอร์ม">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>มีให้ 3 แบบ: ปุ่มไมค์หน้าแรก, ปุ่มในฟอร์มเพิ่มรายการ, และปุ่มลอยสีฟ้า (Smart Voice) ที่รองรับคำสั่ง เช่น “เปิดปฏิทิน”, “ค้นหาค่าน้ำ”, “จดด่วน 500 บาท”</p>
							<button data-demo="voice" class="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- สแกนใบเสร็จ -->
					<div class="flex flex-col md:flex-row gap-6 items-center relative">
						<div class="w-32 h-32 bg-teal-100 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center text-5xl text-teal-600">
							<i class="fa-solid fa-receipt"></i>
						</div>
						<div>
							<h3 class="text-2xl font-bold mb-2">สแกนใบเสร็จ (OCR)
								<button class="speak-btn ml-2 text-teal-600 hover:text-teal-800 dark:text-teal-400" 
									data-speak="คลิกปุ่ม 'เพิ่มด้วยรูปภาพ' เลือกรูปใบเสร็จหรือสลิป ระบบจะใช้เทคโนโลยี OCR อ่านข้อความในรูป เพื่อดึงข้อมูลวันที่ เวลา ยอดเงิน และชื่อผู้รับ จากนั้นจะกรอกข้อมูลลงในฟอร์มให้อัตโนมัติ พร้อมแนบรูปที่บีบอัดแล้ว ช่วยลดการพิมพ์ข้อมูลซ้ำ">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>กด “เพิ่มด้วยรูปภาพ” เลือกรูปสลิป ระบบจะอ่านวันที่ เวลา ยอดเงิน และชื่อผู้รับ แล้วกรอกให้อัตโนมัติ พร้อมแนบรูปบีบอัด</p>
							<button data-demo="receipt" class="mt-3 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- เครื่องคิดเลขในตัว -->
					<div class="flex flex-col md:flex-row gap-6 items-center relative">
						<div class="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-5xl text-purple-600">
							<i class="fa-solid fa-calculator"></i>
						</div>
						<div>
							<h3 class="text-2xl font-bold mb-2">เครื่องคิดเลขในตัว
								<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
									data-speak="ขณะกรอกจำนวนเงิน คุณสามารถกดไอคอนเครื่องคิดเลขเพื่อเปิดหน้าต่างเครื่องคิดเลข พิมพ์สูตร เช่น 150+20*2 แล้วกด = หรือ Enter ผลลัพธ์จะถูกใส่ในช่องจำนวนเงินทันที รองรับการคำนวณพื้นฐาน">
									<i class="fa-solid fa-volume-high"></i>
								</button>
							</h3>
							<p>กดไอคอนเครื่องคิดเลขขณะกรอกจำนวนเงิน พิมพ์สูตร เช่น <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">150+20*2</code> กด = ผลลัพธ์จะถูกใส่ในช่องอัตโนมัติ</p>
							<button data-demo="calc" class="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
								<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
							</button>
						</div>
					</div>
					<!-- ผู้ช่วยอัจฉริยะ -->
					<div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 relative">
						<p class="text-lg text-purple-800 dark:text-purple-300 flex items-start gap-3">
							<i class="fa-solid fa-brain text-4xl"></i>
							<span><b>ผู้ช่วยเสียงอัจฉริยะ (Smart Voice Command) </b> เข้าใจบริบท เช่น ขณะอยู่ในฟอร์มเพิ่มรายการ พูดว่า “บันทึก” หรือ “ยกเลิก” จะทำงานตามนั้น</span>
							<button class="speak-btn ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400" 
								data-speak="ผู้ช่วยเสียงอัจฉริยะจะตรวจจับหน้าจอปัจจุบัน หากคุณอยู่ในฟอร์มเพิ่มรายการแล้วพูด 'บันทึก' ระบบจะกดปุ่มบันทึกให้ทันที หรือถ้าพูด 'ยกเลิก' ก็จะปิดฟอร์ม นอกจากนี้ยังรองรับคำสั่งทั่วไป เช่น 'เปิดตั้งค่า', 'ไปหน้าบัญชี' ฯลฯ">
								<i class="fa-solid fa-volume-high"></i>
							</button>
						</p>
						<button data-demo="smartVoice" class="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่าง
						</button>
					</div>
				</div>
			</section>

			<!-- 8. แก้ไขปัญหาเบื้องต้น -->
			<section id="trouble" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors scroll-mt-24">
				<div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex items-center gap-4 hover:opacity-90 transition-opacity relative">
					<div class="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg">
						<i class="fa-solid fa-circle-question"></i>
					</div>
					<h2 class="text-3xl font-bold text-white">แก้ไขปัญหาเบื้องต้น</h2>
					<button class="speak-btn absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors" 
						data-speak="ส่วนรวมคำแนะนำเมื่อพบปัญหา: แอปค้าง/ช้า ให้กดปุ่มตรวจสอบอัปเดตหรือใช้ Hard Reset; อัปเดตแล้วข้อมูลไม่เปลี่ยน ให้รอ Service Worker แล้วกดปุ่มอัปเดตทันที; ลืมรหัสผ่าน ต้อง Hard Reset หรือนำเข้าไฟล์สำรอง; และช่องทางติดต่อผู้พัฒนา">
						<i class="fa-solid fa-volume-high text-xl"></i>
					</button>
				</div>
				<div class="p-8 space-y-4">
					<div class="flex items-start gap-4">
						<i class="fa-solid fa-circle-exclamation text-2xl text-yellow-600 mt-1"></i>
						<div><b>แอปค้าง/ช้า</b> – กดปุ่ม “ตรวจสอบและอัปเดตเวอร์ชัน” ในตั้งค่า หรือ Hard Reset (ปุ่มล้างระบบ)</div>
						<button class="speak-btn ml-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400" 
							data-speak="เมื่อแอปทำงานช้าหรือค้าง ให้ลองกดปุ่ม 'ตรวจสอบและอัปเดตเวอร์ชัน' ในหน้าตั้งค่า เพื่อล้างแคชและโหลดโค้ดล่าสุด หากยังไม่หาย ให้ใช้ปุ่ม 'ล้างระบบแก้แอปค้าง (Hard Reset)' ซึ่งจะลบ Service Worker, Cache และฐานข้อมูลในเครื่องทั้งหมด (ข้อมูลที่ไม่ได้ซิงค์จะหาย)">
							<i class="fa-solid fa-volume-high"></i>
						</button>
					</div>
					<div class="flex items-start gap-4">
						<i class="fa-solid fa-rotate text-2xl text-blue-600 mt-1"></i>
						<div><b>อัปเดตแล้วข้อมูลไม่เปลี่ยน</b> – รอให้ Service Worker แจ้งเตือนแล้วกด “อัปเดตทันที”</div>
						<button class="speak-btn ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400" 
							data-speak="หากอัปเดตเวอร์ชันแล้วหน้าเว็บยังไม่เปลี่ยน อาจเป็นเพราะ Service Worker ยังคงใช้ Cache เดิม ให้รอให้มีการแจ้งเตือนจาก Service Worker (แถบสีฟ้าด้านล่าง) แล้วกดปุ่ม 'อัปเดตทันที' เพื่อโหลดเวอร์ชันใหม่">
							<i class="fa-solid fa-volume-high"></i>
						</button>
					</div>
					<div class="flex items-start gap-4">
						<i class="fa-solid fa-lock text-2xl text-red-600 mt-1"></i>
						<div><b>ลืมรหัสผ่าน</b> – ต้องล้างข้อมูลทั้งหมด (Hard Reset) หรือนำเข้าไฟล์สำรองที่ไม่มีรหัสผ่าน (ถ้ามี)</div>
						<button class="speak-btn ml-2 text-red-600 hover:text-red-800 dark:text-red-400" 
							data-speak="หากคุณลืมรหัสผ่าน ระบบไม่สามารถกู้คืนให้ได้ เนื่องจากเก็บรหัสผ่านในรูปแบบที่เข้ารหัส วิธีแก้คือทำ Hard Reset เพื่อล้างข้อมูลทั้งหมด (ข้อมูลจะหาย) หรือหากมีไฟล์สำรองที่ไม่มีรหัสผ่าน (เช่น ไฟล์ที่สำรองไว้ก่อนตั้งรหัส) ก็สามารถนำเข้าแทนได้">
							<i class="fa-solid fa-volume-high"></i>
						</button>
					</div>
					<div class="flex items-start gap-4">
						<i class="fa-solid fa-envelope text-2xl text-gray-600 mt-1"></i>
						<div><b>ติดต่อผู้พัฒนา</b> – อีเมล jameskabpom@gmail.com , LINE ID : jamesitshop</div>
						<button class="speak-btn ml-2 text-gray-600 hover:text-gray-800 dark:text-gray-400" 
							data-speak="หากพบปัญหาอื่น ๆ หรือต้องการข้อเสนอแนะ สามารถติดต่อผู้พัฒนาได้ทางอีเมล jameskabpom@gmail.com หรือเพิ่มเพื่อน LINE ID: jamesitshop">
							<i class="fa-solid fa-volume-high"></i>
						</button>
					</div>
					<!-- ปุ่มดูตัวอย่างเคล็ดลับเพิ่มเติม -->
					<div class="relative">
						<button data-demo="troubleshoot" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md transition">
							<i class="fa-regular fa-eye mr-1"></i> ดูตัวอย่างเคล็ดลับเพิ่มเติม
						</button>
					</div>
				</div>
			</section>
			
			<!-- ปุ่มตรวจสอบอัปเดต -->
			<div class="text-center mt-8 flex items-center justify-center gap-2">
				<button onclick="checkForUpdate()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md transition">
					<i class="fa-solid fa-rotate mr-1"></i> ตรวจสอบอัปเดต
				</button>
				<button class="speak-btn bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800 p-3 rounded-full transition-colors" 
					data-speak="กดปุ่มนี้เพื่อตรวจสอบว่าแอปพลิเคชันเป็นเวอร์ชันล่าสุดหรือไม่ ระบบจะเปรียบเทียบกับเวอร์ชันบนเซิร์ฟเวอร์ หากมีเวอร์ชันใหม่จะแจ้งให้คุณทราบ">
					<i class="fa-solid fa-volume-high text-blue-600 dark:text-blue-400"></i>
				</button>
			</div>

			<!-- ปุ่มกลับด้านบนแบบลอย (เฉพาะไอคอน) -->
			<div class="fixed bottom-56 right-5 z-50">
				<a href="javascript:void(0)" id="guide-back-to-top" class="bg-purple-600 hover:bg-purple-700 text-white w-12 h-12 rounded-full shadow-2xl transition flex items-center justify-center" title="กลับด้านบน">
					<i class="fa-solid fa-arrow-up text-xl"></i>
				</a>
			</div>
		</div>
	</div>
`;