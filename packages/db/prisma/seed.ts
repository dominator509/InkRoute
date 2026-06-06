import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "inkroute-demo" },
    update: {
      name: "InkRoute Demo Artist",
      plan: "nomad",
      status: "trial",
      publicSiteName: "Marrow & Meridian Tattoo",
      defaultTimezone: "America/Los_Angeles",
    },
    create: {
      name: "InkRoute Demo Artist",
      slug: "inkroute-demo",
      plan: "nomad",
      status: "trial",
      publicSiteName: "Marrow & Meridian Tattoo",
      defaultTimezone: "America/Los_Angeles",
    },
  });

  await prisma.tenantDomain.upsert({
    where: { hostname: "demo.inkroute.local" },
    update: { tenantId: tenant.id, status: "verified", isPrimary: true },
    create: {
      tenantId: tenant.id,
      hostname: "demo.inkroute.local",
      status: "verified",
      isPrimary: true,
      verifiedAt: new Date("2026-01-05T12:00:00.000Z"),
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@inkroute.demo" },
    update: { name: "Rowan Vale", status: "active" },
    create: {
      email: "owner@inkroute.demo",
      name: "Rowan Vale",
      status: "active",
    },
  });

  const customRole = await prisma.customRole.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "booking_coordinator" } },
    update: {
      label: "Booking Coordinator",
      permissions: ["booking:read", "booking:write", "client:read", "travel:read"],
    },
    create: {
      tenantId: tenant.id,
      key: "booking_coordinator",
      label: "Booking Coordinator",
      permissions: ["booking:read", "booking:write", "client:read", "travel:read"],
      description: "Can triage booking requests without payment or settings access.",
    },
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { role: "owner", status: "active", customRoleId: customRole.id },
    create: {
      tenantId: tenant.id,
      userId: owner.id,
      role: "owner",
      status: "active",
      customRoleId: customRole.id,
      joinedAt: new Date("2026-01-05T12:05:00.000Z"),
    },
  });

  const studio = await prisma.studio.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "private-atelier" } },
    update: {
      name: "Private Atelier",
      city: "Los Angeles",
      region: "CA",
      country: "US",
      timezone: "America/Los_Angeles",
    },
    create: {
      tenantId: tenant.id,
      name: "Private Atelier",
      slug: "private-atelier",
      city: "Los Angeles",
      region: "CA",
      country: "US",
      timezone: "America/Los_Angeles",
      publicNotes: "Private studio address is shared after deposit confirmation.",
    },
  });

  const artist = await prisma.artist.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "rowan-vale" } },
    update: {
      studioId: studio.id,
      userId: owner.id,
      displayName: "Rowan Vale",
      specialties: ["blackwork", "ornamental", "fine_line"],
    },
    create: {
      tenantId: tenant.id,
      studioId: studio.id,
      userId: owner.id,
      displayName: "Rowan Vale",
      slug: "rowan-vale",
      bio: "Nomadic blackwork and ornamental tattoo artist focused on high-contrast pieces, intentional placement, and polished client prep.",
      shortBio: "Nomadic blackwork and ornamental tattoo artist.",
      homeBaseCity: "Los Angeles",
      specialties: ["blackwork", "ornamental", "fine_line"],
      instagramUrl: "https://instagram.com/inkroute_demo",
    },
  });

  const blackwork = await prisma.tattooStyle.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "blackwork" } },
    update: { label: "Blackwork", isActive: true },
    create: {
      tenantId: tenant.id,
      slug: "blackwork",
      label: "Blackwork",
      description: "Bold black ink pieces with strong contrast and graphic composition.",
    },
  });

  const ornamental = await prisma.tattooStyle.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "ornamental" } },
    update: { label: "Ornamental", isActive: true },
    create: {
      tenantId: tenant.id,
      slug: "ornamental",
      label: "Ornamental",
      description: "Pattern-driven ornamental work designed around body flow and symmetry.",
    },
  });

  const fineLine = await prisma.tattooStyle.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "fine-line" } },
    update: { label: "Fine Line", isActive: true },
    create: {
      tenantId: tenant.id,
      slug: "fine-line",
      label: "Fine Line",
      description: "Precise fine-line pieces for smaller custom concepts and delicate details.",
    },
  });

  const portfolioFile = await prisma.fileAsset.upsert({
    where: { bucket_objectKey: { bucket: "inkroute-demo-public", objectKey: "portfolio/blackwork-dahlia.webp" } },
    update: {
      tenantId: tenant.id,
      visibility: "public",
      publicUrl: "/demo/portfolio/blackwork-dahlia.webp",
    },
    create: {
      tenantId: tenant.id,
      uploadedByUserId: owner.id,
      kind: "portfolio_derivative",
      visibility: "public",
      bucket: "inkroute-demo-public",
      objectKey: "portfolio/blackwork-dahlia.webp",
      originalFilename: "blackwork-dahlia.webp",
      mimeType: "image/webp",
      sizeBytes: 184000,
      publicUrl: "/demo/portfolio/blackwork-dahlia.webp",
    },
  });

  const portfolioItem = await prisma.portfolioItem.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "blackwork-dahlia-shoulder" } },
    update: {
      title: "Blackwork Dahlia Shoulder Piece",
      isPublic: true,
      isFeatured: true,
      styles: { set: [{ id: blackwork.id }, { id: ornamental.id }] },
    },
    create: {
      tenantId: tenant.id,
      artistId: artist.id,
      title: "Blackwork Dahlia Shoulder Piece",
      slug: "blackwork-dahlia-shoulder",
      caption: "Large-scale dahlia shoulder composition built around strong silhouette and healed contrast.",
      placement: "shoulder",
      freshness: "healed",
      city: "Los Angeles",
      completedAt: new Date("2025-10-12T20:00:00.000Z"),
      sessionCount: 2,
      isFeatured: true,
      isPublic: true,
      publishedAt: new Date("2026-01-10T12:00:00.000Z"),
      attributionKey: "pf_blackwork_dahlia_shoulder",
      styles: { connect: [{ id: blackwork.id }, { id: ornamental.id }] },
    },
  });

  await prisma.portfolioImage.upsert({
    where: { id: "seed_portfolio_image_blackwork_dahlia" },
    update: {
      tenantId: tenant.id,
      portfolioItemId: portfolioItem.id,
      fileAssetId: portfolioFile.id,
      isPrimary: true,
    },
    create: {
      id: "seed_portfolio_image_blackwork_dahlia",
      tenantId: tenant.id,
      portfolioItemId: portfolioItem.id,
      fileAssetId: portfolioFile.id,
      imageUrl: "/demo/portfolio/blackwork-dahlia.webp",
      altText: "Healed blackwork dahlia tattoo across the shoulder by Rowan Vale.",
      width: 1600,
      height: 2000,
      sortOrder: 0,
      isPrimary: true,
    },
  });

  const denver = await prisma.travelCity.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "denver-co" } },
    update: { city: "Denver", region: "CO", country: "US", timezone: "America/Denver" },
    create: {
      tenantId: tenant.id,
      slug: "denver-co",
      city: "Denver",
      region: "CO",
      country: "US",
      timezone: "America/Denver",
      publicSummary: "Guest spot dates for custom blackwork and ornamental projects.",
      waitlistEnabled: true,
    },
  });

  const travel = await prisma.travelSchedule.upsert({
    where: { id: "seed_travel_denver_july_2026" },
    update: {
      tenantId: tenant.id,
      artistId: artist.id,
      travelCityId: denver.id,
      bookingStatus: "open",
    },
    create: {
      id: "seed_travel_denver_july_2026",
      tenantId: tenant.id,
      artistId: artist.id,
      travelCityId: denver.id,
      title: "Denver Guest Spot",
      startsAt: new Date("2026-07-12T16:00:00.000Z"),
      endsAt: new Date("2026-07-18T23:00:00.000Z"),
      timezone: "America/Denver",
      bookingStatus: "open",
      publicNotes: "Books open for medium and large-scale custom projects.",
    },
  });

  await prisma.availabilityWindow.upsert({
    where: { id: "seed_availability_denver_july_14" },
    update: { status: "open", maxBookings: 2 },
    create: {
      id: "seed_availability_denver_july_14",
      tenantId: tenant.id,
      artistId: artist.id,
      travelCityId: denver.id,
      travelScheduleId: travel.id,
      kind: "booking",
      status: "open",
      startsAt: new Date("2026-07-14T16:00:00.000Z"),
      endsAt: new Date("2026-07-14T23:00:00.000Z"),
      timezone: "America/Denver",
      maxBookings: 2,
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 30,
      publicLabel: "Denver guest spot booking window",
    },
  });

  const client = await prisma.client.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "client@inkroute.demo" } },
    update: { preferredName: "Maya Chen", city: "Denver", region: "CO" },
    create: {
      tenantId: tenant.id,
      email: "client@inkroute.demo",
      phone: "+15550101111",
      preferredName: "Maya Chen",
      city: "Denver",
      region: "CO",
      country: "US",
      timezone: "America/Denver",
      marketingOptIn: true,
      smsOptIn: true,
    },
  });

  await prisma.clientProfile.upsert({
    where: { clientId: client.id },
    update: { preferredContactMethod: "email" },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      preferredContactMethod: "email",
      internalNotes: "Demo client. Use fake data only.",
    },
  });

  const booking = await prisma.bookingRequest.upsert({
    where: { id: "seed_booking_denver_maya" },
    update: { status: "deposit_paid", readinessScore: 92 },
    create: {
      id: "seed_booking_denver_maya",
      tenantId: tenant.id,
      artistId: artist.id,
      clientId: client.id,
      travelCityId: denver.id,
      assignedToUserId: owner.id,
      status: "deposit_paid",
      clientNameSnapshot: "Maya Chen",
      clientEmailSnapshot: "client@inkroute.demo",
      clientPhoneSnapshot: "+15550101111",
      preferredCity: "Denver",
      preferredDate: new Date("2026-07-14T17:00:00.000Z"),
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "6-8 inches",
      budgetMinCents: 70000,
      budgetMaxCents: 110000,
      ideaSummary: "A blackwork botanical forearm piece inspired by dahlias and desert plants, with enough negative space to age well.",
      readinessScore: 92,
      policyAcceptedAt: new Date("2026-05-20T18:00:00.000Z"),
      portfolioAttributionId: portfolioItem.id,
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "denver_guest_spot",
    },
  });

  await prisma.bookingStateEvent.upsert({
    where: { id: "seed_booking_event_deposit_paid" },
    update: { toStatus: "deposit_paid" },
    create: {
      id: "seed_booking_event_deposit_paid",
      tenantId: tenant.id,
      bookingRequestId: booking.id,
      actorUserId: owner.id,
      type: "deposit_paid",
      fromStatus: "deposit_pending",
      toStatus: "deposit_paid",
      note: "Demo booking deposit marked paid through seed data.",
    },
  });

  const appointment = await prisma.appointment.upsert({
    where: { id: "seed_appointment_denver_maya" },
    update: { status: "confirmed" },
    create: {
      id: "seed_appointment_denver_maya",
      tenantId: tenant.id,
      artistId: artist.id,
      clientId: client.id,
      bookingRequestId: booking.id,
      travelCityId: denver.id,
      status: "confirmed",
      title: "Maya Chen — blackwork botanical forearm",
      startsAt: new Date("2026-07-14T17:00:00.000Z"),
      endsAt: new Date("2026-07-14T21:00:00.000Z"),
      timezone: "America/Denver",
      locationLabel: "Denver guest spot studio",
      depositRequiredCents: 15000,
      clientPrepNotes: "Eat beforehand, hydrate, and bring a valid ID.",
    },
  });

  const deposit = await prisma.deposit.upsert({
    where: { id: "seed_deposit_denver_maya" },
    update: { status: "paid", paidAt: new Date("2026-05-20T18:10:00.000Z") },
    create: {
      id: "seed_deposit_denver_maya",
      tenantId: tenant.id,
      bookingRequestId: booking.id,
      appointmentId: appointment.id,
      amountCents: 15000,
      currency: "usd",
      status: "paid",
      dueAt: new Date("2026-05-22T18:00:00.000Z"),
      paidAt: new Date("2026-05-20T18:10:00.000Z"),
      policySnapshot: { cancellationWindowHours: 72, transferableOnce: true },
    },
  });

  const payment = await prisma.payment.upsert({
    where: { id: "seed_payment_denver_maya_deposit" },
    update: { status: "paid" },
    create: {
      id: "seed_payment_denver_maya_deposit",
      tenantId: tenant.id,
      bookingRequestId: booking.id,
      appointmentId: appointment.id,
      depositId: deposit.id,
      provider: "stripe",
      providerPaymentId: "pi_demo_deposit_paid",
      providerSessionId: "cs_demo_deposit_paid",
      status: "paid",
      amountCents: 15000,
      currency: "usd",
      description: "Demo booking deposit for Denver guest spot.",
      receiptUrl: "https://example.com/demo-receipt",
      paidAt: new Date("2026-05-20T18:10:00.000Z"),
    },
  });

  await prisma.paymentAuditLog.upsert({
    where: { id: "seed_payment_audit_deposit_paid" },
    update: { action: "deposit_seeded_paid" },
    create: {
      id: "seed_payment_audit_deposit_paid",
      tenantId: tenant.id,
      paymentId: payment.id,
      depositId: deposit.id,
      actorUserId: owner.id,
      action: "deposit_seeded_paid",
      provider: "stripe",
      metadata: { credentialGated: true, source: "seed" },
    },
  });

  const intakeForm = await prisma.intakeForm.upsert({
    where: { tenantId_key_version: { tenantId: tenant.id, key: "booking_intake", version: 1 } },
    update: { status: "published" },
    create: {
      tenantId: tenant.id,
      key: "booking_intake",
      title: "Tattoo Booking Intake",
      description: "Core intake for custom tattoo booking requests.",
      status: "published",
      version: 1,
    },
  });

  await prisma.intakeQuestion.upsert({
    where: { formId_key: { formId: intakeForm.id, key: "concept" } },
    update: { label: "Describe your tattoo concept" },
    create: {
      tenantId: tenant.id,
      formId: intakeForm.id,
      key: "concept",
      label: "Describe your tattoo concept",
      type: "long_text",
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.intakeResponse.upsert({
    where: { id: "seed_intake_response_maya" },
    update: { answers: { concept: "Blackwork botanical forearm piece with dahlia references." } },
    create: {
      id: "seed_intake_response_maya",
      tenantId: tenant.id,
      formId: intakeForm.id,
      bookingRequestId: booking.id,
      clientId: client.id,
      answers: { concept: "Blackwork botanical forearm piece with dahlia references." },
    },
  });

  const consentForm = await prisma.consentForm.upsert({
    where: { tenantId_key_version: { tenantId: tenant.id, key: "standard_tattoo_consent", version: 1 } },
    update: { status: "published" },
    create: {
      tenantId: tenant.id,
      key: "standard_tattoo_consent",
      title: "Standard Tattoo Consent",
      body: "Demo consent text for development only. Replace with attorney-reviewed production language before launch.",
      status: "published",
      version: 1,
      requiresMedicalAcknowledgment: true,
    },
  });

  const signatureFile = await prisma.fileAsset.upsert({
    where: { bucket_objectKey: { bucket: "inkroute-demo-private", objectKey: "consent/maya-signature.txt" } },
    update: { tenantId: tenant.id, visibility: "client_private" },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      kind: "consent_signature",
      visibility: "client_private",
      bucket: "inkroute-demo-private",
      objectKey: "consent/maya-signature.txt",
      originalFilename: "maya-signature.txt",
      mimeType: "text/plain",
      sizeBytes: 64,
    },
  });

  const consentSignature = await prisma.consentSignature.upsert({
    where: { id: "seed_consent_signature_maya" },
    update: { status: "signed" },
    create: {
      id: "seed_consent_signature_maya",
      tenantId: tenant.id,
      consentFormId: consentForm.id,
      bookingRequestId: booking.id,
      clientId: client.id,
      signatureFileAssetId: signatureFile.id,
      status: "signed",
      signerName: "Maya Chen",
      signerEmail: "client@inkroute.demo",
      signedAt: new Date("2026-05-20T18:05:00.000Z"),
      ipAddressHash: "demo_ip_hash",
      userAgent: "InkRoute seed runner",
    },
  });

  await prisma.medicalSafetyAcknowledgment.upsert({
    where: { id: "seed_medical_ack_maya" },
    update: { status: "completed" },
    create: {
      id: "seed_medical_ack_maya",
      tenantId: tenant.id,
      clientId: client.id,
      bookingRequestId: booking.id,
      consentSignatureId: consentSignature.id,
      status: "completed",
      acknowledgments: { over18: true, notPregnant: true, noBloodThinners: true },
      flaggedReasons: [],
    },
  });

  const referenceAsset = await prisma.fileAsset.upsert({
    where: { bucket_objectKey: { bucket: "inkroute-demo-private", objectKey: "references/maya-dahlia-reference.webp" } },
    update: { tenantId: tenant.id, visibility: "client_private" },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      kind: "reference_image",
      visibility: "client_private",
      bucket: "inkroute-demo-private",
      objectKey: "references/maya-dahlia-reference.webp",
      originalFilename: "maya-dahlia-reference.webp",
      mimeType: "image/webp",
      sizeBytes: 99000,
    },
  });

  await prisma.referenceImage.upsert({
    where: { id: "seed_reference_maya_dahlia" },
    update: { label: "Dahlia reference" },
    create: {
      id: "seed_reference_maya_dahlia",
      tenantId: tenant.id,
      bookingRequestId: booking.id,
      clientId: client.id,
      fileAssetId: referenceAsset.id,
      label: "Dahlia reference",
      notes: "Private reference image placeholder; not public.",
    },
  });

  const thread = await prisma.messageThread.upsert({
    where: { id: "seed_thread_maya_booking" },
    update: { subject: "Denver booking prep" },
    create: {
      id: "seed_thread_maya_booking",
      tenantId: tenant.id,
      clientId: client.id,
      bookingRequestId: booking.id,
      appointmentId: appointment.id,
      subject: "Denver booking prep",
      lastMessageAt: new Date("2026-05-20T18:30:00.000Z"),
    },
  });

  await prisma.message.upsert({
    where: { id: "seed_message_maya_prep" },
    update: { status: "sent" },
    create: {
      id: "seed_message_maya_prep",
      tenantId: tenant.id,
      threadId: thread.id,
      senderUserId: owner.id,
      channel: "email",
      direction: "outbound",
      status: "sent",
      body: "Thanks for booking. Your Denver appointment is confirmed; prep notes are attached in your client portal.",
      sentAt: new Date("2026-05-20T18:30:00.000Z"),
    },
  });

  const notification = await prisma.notification.upsert({
    where: { id: "seed_notification_aftercare_checkin" },
    update: { status: "pending" },
    create: {
      id: "seed_notification_aftercare_checkin",
      tenantId: tenant.id,
      clientId: client.id,
      bookingRequestId: booking.id,
      appointmentId: appointment.id,
      type: "aftercare_checkin",
      title: "Aftercare check-in",
      body: "Send Maya a day-two aftercare check-in after the Denver appointment.",
      status: "pending",
      scheduledFor: new Date("2026-07-16T17:00:00.000Z"),
    },
  });

  await prisma.notificationDelivery.upsert({
    where: { id: "seed_notification_delivery_aftercare_email" },
    update: { status: "queued" },
    create: {
      id: "seed_notification_delivery_aftercare_email",
      tenantId: tenant.id,
      notificationId: notification.id,
      channel: "email",
      status: "queued",
      destinationHash: "demo_email_hash",
      provider: "credential_gated_email_provider",
    },
  });

  await prisma.review.upsert({
    where: { id: "seed_review_healed_work" },
    update: { status: "approved", rating: 5 },
    create: {
      id: "seed_review_healed_work",
      tenantId: tenant.id,
      artistId: artist.id,
      clientId: client.id,
      bookingRequestId: booking.id,
      status: "approved",
      rating: 5,
      title: "Intentional and calm process",
      body: "The intake made it easy to communicate what I wanted, and the healed result is exactly the level of contrast I hoped for.",
      publicDisplayName: "Maya C.",
      source: "manual_seed",
      publishedAt: new Date("2026-05-25T12:00:00.000Z"),
    },
  });

  await prisma.seoCityPage.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "denver-blackwork-tattoo-artist" } },
    update: { status: "published", travelCityId: denver.id },
    create: {
      tenantId: tenant.id,
      travelCityId: denver.id,
      slug: "denver-blackwork-tattoo-artist",
      city: "Denver",
      region: "CO",
      country: "US",
      title: "Denver Blackwork Tattoo Guest Spot | Rowan Vale",
      metaDescription: "Book a Denver guest spot with Rowan Vale for custom blackwork and ornamental tattoo projects.",
      canonicalPath: "/cities/denver-blackwork-tattoo-artist",
      status: "published",
      heroCopy: "Custom blackwork and ornamental tattooing during limited Denver travel dates.",
      faq: [{ question: "Is the studio address public?", answer: "The exact private studio address is shared after deposit confirmation." }],
      internalLinks: [{ label: "View blackwork portfolio", href: "/portfolio?style=blackwork" }],
      featuredPortfolio: { connect: [{ id: portfolioItem.id }] },
      publishedAt: new Date("2026-05-21T12:00:00.000Z"),
    },
  });

  await prisma.seoStylePage.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "blackwork-tattoo" } },
    update: { status: "published", tattooStyleId: blackwork.id },
    create: {
      tenantId: tenant.id,
      tattooStyleId: blackwork.id,
      slug: "blackwork-tattoo",
      styleName: "Blackwork",
      title: "Custom Blackwork Tattoos | Rowan Vale",
      metaDescription: "Explore custom blackwork tattoo projects, healed examples, placement guidance, and booking details.",
      canonicalPath: "/styles/blackwork-tattoo",
      status: "published",
      bodyCopy: "Blackwork projects are designed around contrast, clarity, and placement that ages cleanly.",
      faq: [{ question: "Do blackwork pieces need multiple sessions?", answer: "Large pieces often benefit from multiple sessions for comfort and healing." }],
      internalLinks: [{ label: "Denver guest spot", href: "/cities/denver-blackwork-tattoo-artist" }],
      featuredPortfolio: { connect: [{ id: portfolioItem.id }] },
      publishedAt: new Date("2026-05-21T12:00:00.000Z"),
    },
  });

  await prisma.featureFlag.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "nomad_mode" } },
    update: { enabled: true },
    create: {
      tenantId: tenant.id,
      key: "nomad_mode",
      scope: "tenant",
      enabled: true,
      description: "Show travel schedule and city availability on the public site.",
    },
  });

  await prisma.releaseRecord.upsert({
    where: { id: "seed_release_phase_2" },
    update: { notes: "Phase 2 database/domain model scaffold added." },
    create: {
      id: "seed_release_phase_2",
      tenantId: tenant.id,
      releasedByUserId: owner.id,
      version: "0.2.0-scaffold",
      channel: "development",
      notes: "Phase 2 database/domain model scaffold added. Migration and seed execution remain environment-gated.",
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorUserId: owner.id,
      action: "phase_2_seed_script_ran",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { phase: 2, environment: "development" },
    },
  });

  console.log(`Seeded InkRoute demo tenant: ${tenant.slug}`);
  console.log(`Seeded artist: ${artist.displayName}`);
  console.log(`Seeded booking request: ${booking.id}`);
  console.log(`Seeded demo styles: ${[blackwork.slug, ornamental.slug, fineLine.slug].join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
