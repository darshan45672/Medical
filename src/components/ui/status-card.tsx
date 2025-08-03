interface StatusCardProps {
  title: string
  subtitle: string
  value: string | number
  icon: React.ComponentType<any>
  gradient: string
  iconColor: string
  textColor: string
  bgColor: string
  className?: string
}

export function StatusCard({
  title,
  subtitle,
  value,
  icon: Icon,
  gradient,
  iconColor,
  textColor,
  bgColor,
  className = ''
}: StatusCardProps) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-opacity-20 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${gradient} rounded-xl shadow-md`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${textColor} text-lg`}>{title}</h3>
            <p className="text-sm opacity-80">{subtitle}</p>
          </div>
        </div>
        <div className={`text-3xl font-bold ${textColor}`}>
          {value}
        </div>
      </div>
    </div>
  )
}
