#pragma once
#ifndef __3DO_H__
#define __3DO_H__

#include <memory>
#include <ostream>
#include <string>

class TA3DOFile
{

public:
  TA3DOFile(const std::string&);
  ~TA3DOFile();



  void ExportToCollada(std::ostream&);

private:
  class impl;
  std::unique_ptr<impl> _pimpl;
};



#endif